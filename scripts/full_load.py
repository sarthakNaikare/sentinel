
import asyncio, asyncpg, httpx, os, sys, time, logging
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
load_dotenv('config/.env')
sys.path.insert(0, '.')
from ingestion.workers.nvd_worker import parse_cve, bulk_insert, NVD_KEY, PAGE_SIZE, RATE_DELAY

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
log = logging.getLogger('sentinel.fullload')

async def fetch(client, start, s, e):
    params = {'resultsPerPage': PAGE_SIZE, 'startIndex': start, 'lastModStartDate': s, 'lastModEndDate': e}
    headers = {'apiKey': NVD_KEY} if NVD_KEY else {}
    for _ in range(3):
        try:
            r = await client.get('https://services.nvd.nist.gov/rest/json/cves/2.0', params=params, headers=headers, timeout=30)
            if r.status_code == 200: return r.json()
            log.warning(f'NVD {r.status_code}')
            await asyncio.sleep(6)
        except Exception as ex:
            log.warning(f'Error: {ex}')
            await asyncio.sleep(6)
    return {'totalResults': 0, 'vulnerabilities': []}

async def main():
    conn = await asyncpg.connect(os.getenv('TIMESCALE_URL'))
    end = datetime.now(timezone.utc)
    start = end - timedelta(days=3650)
    windows, cur = [], start
    while cur < end:
        nxt = min(cur + timedelta(days=100), end)
        windows.append((cur, nxt))
        cur = nxt
    log.info(f'Full load: {len(windows)} windows')
    total = 0
    async with httpx.AsyncClient() as client:
        for i, (ws, we) in enumerate(windows):
            s = ws.strftime('%Y-%m-%dT%H:%M:%S.000')
            e = we.strftime('%Y-%m-%dT%H:%M:%S.000')
            log.info(f'Window {i+1}/{len(windows)}: {s[:10]} to {e[:10]}')
            first = await fetch(client, 0, s, e)
            n_total = first.get('totalResults', 0)
            if not n_total: continue
            idx = 0
            while idx < n_total:
                t0 = time.monotonic()
                data = first if idx == 0 else await fetch(client, idx, s, e)
                batch = [r for r in (parse_cve(v) for v in data.get('vulnerabilities', [])) if r]
                if batch:
                    try:
                        n = await bulk_insert(conn, batch)
                        total += n
                        log.info(f'  +{n} [{int((time.monotonic()-t0)*1000)}ms] total:{total}')
                    except Exception as ex:
                        log.warning(f'  Skip: {str(ex)[:60]}')
                idx += PAGE_SIZE
                if idx < n_total: await asyncio.sleep(RATE_DELAY)
    log.info(f'Done. Total: {total}')
    await conn.close()

asyncio.run(main())
