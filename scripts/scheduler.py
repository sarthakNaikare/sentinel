"""
SENTINEL — Daily scheduler
Run this once and it keeps everything fresh automatically.
"""
import asyncio
import logging
import os
import sys
from datetime import datetime, timezone

sys.path.insert(0, '.')
from dotenv import load_dotenv
load_dotenv('config/.env')

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s'
)
log = logging.getLogger('sentinel.scheduler')


async def run_nvd():
    log.info('Running NVD delta update...')
    import asyncpg
    from ingestion.workers.nvd_worker import ingest
    conn = await asyncpg.connect(os.getenv('TIMESCALE_URL'))
    n = await ingest(conn, days_back=2)
    await conn.close()
    log.info(f'NVD: {n} new/updated CVEs')


async def run_kev():
    log.info('Running KEV update...')
    import ingestion.workers.kev_worker as kev
    await kev.main()


async def run_epss():
    log.info('Running EPSS update...')
    import ingestion.workers.epss_worker as epss
    await epss.main()


async def daily_refresh():
    log.info('=== Sentinel daily refresh starting ===')
    log.info(f'Time: {datetime.now(timezone.utc).isoformat()}')

    for name, coro in [('NVD', run_nvd), ('KEV', run_kev), ('EPSS', run_epss)]:
        try:
            await coro()
            log.info(f'{name} done.')
        except Exception as e:
            log.error(f'{name} failed: {e}')

    log.info('=== Daily refresh complete ===')


async def main():
    while True:
        await daily_refresh()
        log.info('Sleeping 24 hours until next refresh...')
        await asyncio.sleep(86400)


if __name__ == '__main__':
    asyncio.run(main())
