
import asyncio, gzip, csv, hashlib, logging, os, time
from datetime import datetime, timezone, timedelta
import asyncpg, httpx
from dotenv import load_dotenv

load_dotenv("config/.env")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("sentinel.epss")
TIMESCALE = os.getenv("TIMESCALE_URL")

async def main():
    log.info("=== Sentinel EPSS Worker (fixing snapshots) ===")
    today   = datetime.now(timezone.utc).date()
    csv_url = f"https://epss.empiricalsecurity.com/epss_scores-{today}.csv.gz"
    log.info(f"Downloading {csv_url}")
    t0 = time.monotonic()
    async with httpx.AsyncClient(follow_redirects=True) as client:
        resp = await client.get(csv_url, timeout=120)
        if resp.status_code != 200:
            yesterday = today - timedelta(days=1)
            csv_url   = f"https://epss.empiricalsecurity.com/epss_scores-{yesterday}.csv.gz"
            resp = await client.get(csv_url, timeout=120)
            resp.raise_for_status()
    raw        = gzip.decompress(resp.content)
    lines      = raw.decode("utf-8").splitlines()
    data_lines = [l for l in lines if not l.startswith("#")]
    all_scores = list(csv.DictReader(data_lines))
    log.info(f"Parsed {len(all_scores)} EPSS scores")

    conn = await asyncpg.connect(TIMESCALE)

    our_cves = set(r["cve_id"] for r in await conn.fetch("SELECT DISTINCT cve_id FROM cve_events"))
    matched  = [(today, s["cve"], float(s.get("epss",0)), float(s.get("percentile",0)))
                for s in all_scores if s.get("cve") in our_cves]
    log.info(f"Inserting {len(matched)} snapshots (skipping duplicates)...")

    await conn.executemany("""
        INSERT INTO epss_snapshots (snapshot_date, cve_id, epss_score, epss_percentile)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT DO NOTHING
    """, matched)
    log.info(f"Snapshots done.")

    top = await conn.fetch("""
        SELECT cve_id, epss_score, severity, is_kev
        FROM cve_events WHERE epss_score IS NOT NULL
        ORDER BY epss_score DESC LIMIT 10
    """)
    log.info("--- Top 10 EPSS ---")
    for r in top:
        log.info(f"  {r['cve_id']}  EPSS:{r['epss_score']:.4f}  {r['severity']}  KEV:{r['is_kev']}")

    await conn.close()
    log.info(f"Done in {int(time.monotonic()-t0)}s")

asyncio.run(main())
