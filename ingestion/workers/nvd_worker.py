"""
SENTINEL — NVD Ingestion Worker
Pulls CVEs from NIST NVD API v2 and bulk-inserts into TimescaleDB.
"""

import asyncio
import hashlib
import json
import logging
import os
import time
from datetime import datetime, timezone, timedelta
from typing import Optional

import asyncpg
import httpx
from dotenv import load_dotenv

load_dotenv('config/.env')

logging.basicConfig(
    level=getattr(logging, os.getenv('LOG_LEVEL', 'INFO')),
    format='%(asctime)s [%(levelname)s] %(message)s'
)
log = logging.getLogger('sentinel.nvd')

NVD_BASE   = 'https://services.nvd.nist.gov/rest/json/cves/2.0'
NVD_KEY    = os.getenv('NVD_API_KEY', '')
TIMESCALE  = os.getenv('TIMESCALE_URL')
PAGE_SIZE  = 2000
RATE_DELAY = 0.6 if NVD_KEY else 6.0


def parse_severity(metrics: dict):
    for key in ('cvssMetricV31', 'cvssMetricV30', 'cvssMetricV2'):
        if key in metrics and metrics[key]:
            m    = metrics[key][0]
            data = m.get('cvssData', {})
            score    = data.get('baseScore')
            vector   = data.get('vectorString')
            severity = m.get('baseSeverity') or data.get('baseSeverity')
            if score:
                return float(score), vector, severity.upper() if severity else None
    return None, None, None


def parse_cve(item: dict) -> Optional[dict]:
    try:
        cve    = item.get('cve', {})
        cve_id = cve.get('id')
        if not cve_id:
            return None

        published = cve.get('published')
        modified  = cve.get('lastModified')
        if not published:
            return None

        published_at = datetime.fromisoformat(published.replace('Z', '+00:00'))
        updated_at   = datetime.fromisoformat(modified.replace('Z', '+00:00')) if modified else published_at

        descriptions = cve.get('descriptions', [])
        description  = next(
            (d['value'] for d in descriptions if d.get('lang') == 'en'),
            descriptions[0]['value'] if descriptions else None
        )

        metrics                           = cve.get('metrics', {})
        cvss_score, cvss_vector, severity = parse_severity(metrics)

        is_kev         = 'cisaExploitAdd' in cve
        kev_added_date = None
        if is_kev and cve.get('cisaExploitAdd'):
            try:
                kev_added_date = datetime.fromisoformat(cve['cisaExploitAdd']).date()
            except Exception:
                pass

        cpe_matches = []
        for config in cve.get('configurations', []):
            for node in config.get('nodes', []):
                for match in node.get('cpeMatch', []):
                    if match.get('vulnerable'):
                        cpe_matches.append(match.get('criteria', ''))

        refs = [r.get('url') for r in cve.get('references', []) if r.get('url')]

        return {
            'published_at':        published_at,
            'cve_id':              cve_id,
            'source_id':           1,
            'cvss_score':          cvss_score,
            'cvss_vector':         cvss_vector,
            'severity':            severity,
            'epss_score':          None,
            'epss_percentile':     None,
            'is_kev':              is_kev,
            'kev_added_date':      kev_added_date,
            'exploit_available':   is_kev,
            'affected_packages':   [],
            'affected_ecosystems': [],
            'cpe_matches':         cpe_matches[:20],
            'description':         description[:2000] if description else None,
            'patch_available':     False,
            'patched_versions':    [],
            'updated_at':          updated_at,
            'raw_data':            json.dumps({'id': cve_id, 'vulnStatus': cve.get('vulnStatus')}),
        }
    except Exception as e:
        log.warning(f'Failed to parse {item}: {e}')
        return None


async def bulk_insert(conn, rows):
    if not rows:
        return 0
    records = [
        (
            r['published_at'], r['cve_id'], r['source_id'],
            r['cvss_score'], r['cvss_vector'], r['severity'],
            r['epss_score'], r['epss_percentile'],
            r['is_kev'], r['kev_added_date'], r['exploit_available'],
            r['affected_packages'], r['affected_ecosystems'], r['cpe_matches'],
            r['description'], r['patch_available'], r['patched_versions'],
            r['updated_at'], r['raw_data'],
        )
        for r in rows
    ]
    await conn.copy_records_to_table(
        'cve_events',
        records=records,
        columns=[
            'published_at', 'cve_id', 'source_id',
            'cvss_score', 'cvss_vector', 'severity',
            'epss_score', 'epss_percentile',
            'is_kev', 'kev_added_date', 'exploit_available',
            'affected_packages', 'affected_ecosystems', 'cpe_matches',
            'description', 'patch_available', 'patched_versions',
            'updated_at', 'raw_data',
        ]
    )
    return len(records)


async def log_batch(conn, cve_ids, rows, duration_ms, status='success', error=None):
    batch_hash = hashlib.sha256('|'.join(sorted(cve_ids)).encode()).hexdigest()
    await conn.execute('''
        INSERT INTO ingestion_log
            (logged_at, source_id, batch_hash, rows_ingested, cve_ids, status, error_msg, duration_ms)
        VALUES (NOW(), 1, $1, $2, $3, $4, $5, $6)
    ''', batch_hash, rows, cve_ids[:100], status, error, duration_ms)


async def fetch_page(client, start, mod_start, mod_end):
    params  = {'resultsPerPage': PAGE_SIZE, 'startIndex': start,
                'lastModStartDate': mod_start, 'lastModEndDate': mod_end}
    headers = {'apiKey': NVD_KEY} if NVD_KEY else {}
    for attempt in range(3):
        try:
            resp = await client.get(NVD_BASE, params=params, headers=headers, timeout=30)
            if resp.status_code == 200:
                return resp.json()
            elif resp.status_code == 429:
                log.warning('Rate limited — waiting 30s')
                await asyncio.sleep(30)
            else:
                log.warning(f'NVD {resp.status_code}, attempt {attempt+1}')
                await asyncio.sleep(5)
        except Exception as e:
            log.warning(f'Request error: {e}, attempt {attempt+1}')
            await asyncio.sleep(5)
    raise RuntimeError('NVD API failed after 3 attempts')


async def ingest(conn, days_back=30):
    mod_end   = datetime.now(timezone.utc)
    mod_start = mod_end - timedelta(days=days_back)
    mod_start_str = mod_start.strftime('%Y-%m-%dT%H:%M:%S.000')
    mod_end_str   = mod_end.strftime('%Y-%m-%dT%H:%M:%S.000')

    log.info(f'Fetching CVEs modified in last {days_back} days...')

    async with httpx.AsyncClient() as client:
        first  = await fetch_page(client, 0, mod_start_str, mod_end_str)
        total  = first.get('totalResults', 0)
        log.info(f'Total CVEs available: {total}')

        inserted  = 0
        start_idx = 0

        while start_idx < total:
            t0 = time.monotonic()

            data = first if start_idx == 0 else await fetch_page(
                client, start_idx, mod_start_str, mod_end_str)

            vulns = data.get('vulnerabilities', [])
            if not vulns:
                break

            batch = [r for r in (parse_cve(v) for v in vulns) if r]

            if batch:
                n        = await bulk_insert(conn, batch)
                inserted += n
                duration = int((time.monotonic() - t0) * 1000)
                await log_batch(conn, [r['cve_id'] for r in batch], n, duration)
                log.info(f'  Page {start_idx//PAGE_SIZE + 1}: inserted {n} CVEs '
                         f'(total {inserted}/{total}) [{duration}ms]')

            start_idx += PAGE_SIZE
            if start_idx < total:
                await asyncio.sleep(RATE_DELAY)

    return inserted


async def main():
    log.info('=== Sentinel NVD Worker ===')
    log.info(f'API key: {"SET" if NVD_KEY else "NOT SET"}')

    conn     = await asyncpg.connect(TIMESCALE)
    existing = await conn.fetchval('SELECT COUNT(*) FROM cve_events')
    log.info(f'CVEs already in DB: {existing}')

    days = 30 if existing == 0 else 1
    total = await ingest(conn, days_back=days)

    counts = await conn.fetch('''
        SELECT severity, COUNT(*) as cnt
        FROM cve_events
        GROUP BY severity
        ORDER BY cnt DESC
    ''')
    log.info('--- Results ---')
    for row in counts:
        log.info(f'  {row["severity"] or "UNKNOWN"}: {row["cnt"]}')

    await conn.close()
    log.info(f'Done. {total} CVEs inserted.')


if __name__ == '__main__':
    asyncio.run(main())
