"""
SENTINEL — CISA KEV Worker
Downloads the CISA Known Exploited Vulnerabilities catalog
and marks matching CVEs in our database.
No API key needed. Updated daily by CISA.
"""

import asyncio
import hashlib
import logging
import os
from datetime import datetime

import asyncpg
import httpx
from dotenv import load_dotenv

load_dotenv('config/.env')

logging.basicConfig(
    level=getattr(logging, os.getenv('LOG_LEVEL', 'INFO')),
    format='%(asctime)s [%(levelname)s] %(message)s'
)
log = logging.getLogger('sentinel.kev')

KEV_URL   = 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json'
TIMESCALE = os.getenv('TIMESCALE_URL')


async def fetch_kev() -> list[dict]:
    """Download the full KEV catalog from CISA."""
    log.info('Downloading CISA KEV catalog...')
    async with httpx.AsyncClient() as client:
        resp = await client.get(KEV_URL, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        vulns = data.get('vulnerabilities', [])
        log.info(f'Downloaded {len(vulns)} KEV entries')
        return vulns


async def update_kev(conn, vulns: list[dict]) -> dict:
    """
    Mark CVEs in our database that appear in the KEV catalog.
    Updates is_kev, kev_added_date, exploit_available flags.
    """
    updated   = 0
    not_found = 0
    cve_ids   = []

    for v in vulns:
        cve_id   = v.get('cveID')
        added    = v.get('dateAdded')
        if not cve_id:
            continue

        cve_ids.append(cve_id)

        added_date = None
        if added:
            try:
                added_date = datetime.strptime(added, '%Y-%m-%d').date()
            except Exception:
                pass

        result = await conn.execute('''
            UPDATE cve_events
            SET
                is_kev           = TRUE,
                kev_added_date   = $2,
                exploit_available = TRUE,
                updated_at       = NOW()
            WHERE cve_id = $1
        ''', cve_id, added_date)

        rows = int(result.split()[-1])
        if rows > 0:
            updated += rows
        else:
            not_found += 1

    return {
        'total_kev':  len(vulns),
        'updated':    updated,
        'not_found':  not_found,
        'cve_ids':    cve_ids,
    }


async def main():
    log.info('=== Sentinel KEV Worker ===')

    conn  = await asyncpg.connect(TIMESCALE)
    vulns = await fetch_kev()

    t0     = __import__('time').monotonic()
    result = await update_kev(conn, vulns)
    ms     = int((__import__('time').monotonic() - t0) * 1000)

    batch_hash = hashlib.sha256(
        '|'.join(sorted(result['cve_ids'])).encode()
    ).hexdigest()

    await conn.execute('''
        INSERT INTO ingestion_log
            (logged_at, source_id, batch_hash, rows_ingested, cve_ids, status, duration_ms)
        VALUES (NOW(), 2, $1, $2, $3, 'success', $4)
    ''', batch_hash, result['updated'], result['cve_ids'][:200], ms)

    log.info(f"KEV catalog:  {result['total_kev']} entries")
    log.info(f"Updated:      {result['updated']} CVEs marked as KEV")
    log.info(f"Not in DB:    {result['not_found']} (CVEs we haven't ingested yet)")
    log.info(f"Duration:     {ms}ms")

    kev_count = await conn.fetchval(
        'SELECT COUNT(*) FROM cve_events WHERE is_kev = TRUE'
    )
    log.info(f"Total KEV in DB: {kev_count}")

    await conn.close()
    log.info('Done.')


if __name__ == '__main__':
    asyncio.run(main())
