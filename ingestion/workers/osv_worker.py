
import asyncio, json, logging, os, time
from datetime import datetime, timezone
import asyncpg, httpx
from dotenv import load_dotenv

load_dotenv("config/.env")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("sentinel.osv")
TIMESCALE = os.getenv("TIMESCALE_URL")
OSV_BATCH = "https://api.osv.dev/v1/querybatch"
OSV_VULN  = "https://api.osv.dev/v1/vulns/{}"


def parse_requirements(text):
    packages = []
    for line in text.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if "==" in line:
            name, version = line.split("==", 1)
            packages.append({"name": name.strip(), "version": version.strip()})
    return packages


def carbon_age(published_str):
    if not published_str:
        return "unknown"
    try:
        pub = datetime.fromisoformat(published_str.replace("Z","+00:00"))
        age = datetime.now(timezone.utc) - pub
        if age.days > 365:
            return f"{age.days//365}y {(age.days%365)//30}m"
        elif age.days > 30:
            return f"{age.days//30}m {age.days%30}d"
        return f"{age.days}d"
    except Exception:
        return "unknown"


async def get_cve_aliases(client, osv_id):
    try:
        resp = await client.get(OSV_VULN.format(osv_id), timeout=15)
        if resp.status_code == 200:
            data    = resp.json()
            aliases = data.get("aliases", [])
            return [a for a in aliases if a.startswith("CVE-")]
    except Exception:
        pass
    return []


async def scan_stack(stack_file):
    log.info("=== Sentinel OSV Stack Scanner ===")
    with open(stack_file) as f:
        packages = parse_requirements(f.read())
    log.info(f"Scanning {len(packages)} packages: {[p['name'] for p in packages]}")

    conn = await asyncpg.connect(TIMESCALE)

    async with httpx.AsyncClient() as client:
        queries = [
            {"package": {"name": p["name"], "ecosystem": "PyPI"}, "version": p["version"]}
            for p in packages
        ]
        resp    = await client.post(OSV_BATCH, json={"queries": queries}, timeout=30)
        results = resp.json().get("results", [])

        findings = []
        osv_ids  = []
        for pkg, result in zip(packages, results):
            for v in result.get("vulns", []):
                osv_ids.append((pkg, v.get("id"), v.get("summary","")))

        log.info(f"Found {len(osv_ids)} vulns, fetching CVE aliases...")

        tasks   = [get_cve_aliases(client, osv_id) for _, osv_id, _ in osv_ids]
        aliases = await asyncio.gather(*tasks)

        for (pkg, osv_id, summary), cve_list in zip(osv_ids, aliases):
            findings.append({
                "package": pkg["name"],
                "version": pkg["version"],
                "osv_id":  osv_id,
                "cve_ids": cve_list,
                "summary": summary,
            })

    log.info("Enriching with TimescaleDB...")
    enriched = []
    for f in findings:
        best = None
        for cve_id in f["cve_ids"]:
            row = await conn.fetchrow("""
                SELECT cve_id, cvss_score, severity, epss_score,
                       is_kev, description, published_at
                FROM cve_events
                WHERE cve_id = $1
                ORDER BY published_at DESC LIMIT 1
            """, cve_id)
            if row and (best is None or (row["cvss_score"] or 0) > (best["cvss_score"] or 0)):
                best = row
        if best:
            f["severity"]    = best["severity"]
            f["cvss"]        = float(best["cvss_score"]) if best["cvss_score"] else None
            f["epss"]        = float(best["epss_score"]) if best["epss_score"] else None
            f["is_kev"]      = best["is_kev"]
            f["description"] = best["description"]
            f["published"]   = best["published_at"].isoformat() if best["published_at"] else None
        else:
            f["severity"] = None
            f["cvss"]     = None
            f["epss"]     = None
            f["is_kev"]   = False
            f["published"]= None
        enriched.append(f)

    enriched.sort(key=lambda x: (
        0 if x.get("is_kev") else 1,
        -(x.get("epss") or 0),
        -(x.get("cvss") or 0)
    ))

    await conn.close()

    print("\n" + "="*60)
    print(f"SENTINEL — Stack Scan Results")
    print(f"Packages: {len(packages)}  |  Vulnerabilities: {len(enriched)}")
    print("="*60)

    for f in enriched:
        kev_badge = " *** KEV - ACTIVELY EXPLOITED ***" if f.get("is_kev") else ""
        epss_str  = f"EPSS:{f['epss']:.3f}" if f.get("epss") else "EPSS:?"
        cvss_str  = f"CVSS:{f['cvss']:.1f}" if f.get("cvss") else "CVSS:?"
        age       = carbon_age(f.get("published"))
        cve_str   = ", ".join(f["cve_ids"]) if f["cve_ids"] else f["osv_id"]
        sev       = f.get("severity") or "UNKNOWN"
        print(f"\n  {f['package']}=={f['version']}  →  {cve_str}{kev_badge}")
        print(f"  {sev:8}  {cvss_str}  {epss_str}  age:{age}")
        if f.get("summary"):
            print(f"  {f['summary'][:80]}")

    print("\n" + "="*60)
    critical = [f for f in enriched if f.get("severity") == "CRITICAL"]
    kev_list = [f for f in enriched if f.get("is_kev")]
    high     = [f for f in enriched if f.get("severity") == "HIGH"]
    print(f"CRITICAL: {len(critical)}  HIGH: {len(high)}  KEV: {len(kev_list)}")
    print("="*60)


if __name__ == "__main__":
    import sys
    stack_file = sys.argv[1] if len(sys.argv) > 1 else "test_stack.txt"
    asyncio.run(scan_stack(stack_file))
