# SENTINEL
### Real-time Temporal Threat Intelligence Engine

> Built on TimescaleDB · Ghostgres · .NET 8 · Python · React

---

## What is Sentinel?

Sentinel is a living threat intelligence database that doesn't just *store* CVEs — it understands their decay, mutation, and exploitability over time using TimescaleDB's native time-series superpowers.

Every existing CVE platform stores vulnerabilities as static records. Sentinel treats them as time-series events — tracking how dangerous each vulnerability becomes over time using EPSS trajectory, KEV confirmation, and temporal chain detection.

> "This product uses data from the NVD API but is not endorsed or certified by the NVD."

---

## The problem nobody solved

CVE databases (NVD, OSV, Mitre) are static. They store vulnerabilities as records. They have no concept of *time-aware exploitability* — the idea that a vulnerability's danger evolves based on patch rates, exploit availability in the wild, affected system exposure, and temporal clustering with related CVEs.

TimescaleDB was literally built for this. Sentinel is the first tool to use it this way.

---

## Data sources — 5 authoritative free feeds

| Source | What it provides | Authority |
|--------|-----------------|-----------|
| NVD API v2 | 456k+ CVEs, CVSS scores, KEV fields | US Gov — nist.gov |
| CISA KEV catalog | Confirmed in-the-wild exploits | US Gov — cisa.gov |
| EPSS (FIRST.org) | 30-day exploit probability scores | FIRST.org |
| OSV.dev | Ecosystem package vulnerabilities | Google |
| GitHub Advisory | Supply chain vulnerabilities | GitHub |

---

## TimescaleDB architecture
cve_events (hypertable)
└── 7-day chunks
└── Hypercore columnar compression (88% savings)
└── Compression after 7 days
└── Retention: 2 years
epss_snapshots (hypertable)
└── 30-day chunks
└── Daily EPSS score per CVE → carbon dating curves
ingestion_log (hypertable)
└── SHA-256 batch hashing → cryptographic integrity
Continuous aggregates (3-level hierarchy)
raw cve_events
└── threat_scores_1h   (refresh: every 1h)
└── threat_scores_24h  (refresh: every 1d)
└── threat_scores_7d   (refresh: every 7d)
epss_snapshots
└── epss_trends_24h    (refresh: every 1d)
---

## Key features

**Carbon dating** — Every CVE gets an exposure age computed from your deployment date, weighted by EPSS score using TimescaleDB's time_weight hyperfunction. See exactly how long that vulnerability has been sitting in your stack.

**Chain risk detection** — TimescaleDB window functions detect CVEs that tend to get exploited together within 72-hour windows. Sentinel shows you the full attack chain, not just individual vulnerabilities.

**Stack scanner** — Drop in a requirements.txt, package.json, or go.mod. Sentinel resolves every dependency against OSV + NVD and returns a prioritised threat report enriched with EPSS scores and KEV flags.

**Cryptographic integrity** — Every ingestion batch gets a SHA-256 hash stored in the ingestion_log hypertable. Users can verify their CVE data hasn't been tampered with.

**LEV scoring** — NIST's 2025 Likely Exploited Vulnerabilities metric, computed natively using TimescaleDB hyperfunctions on historical EPSS snapshots.

---

## Tech stack

- **TimescaleDB** — hypertables, continuous aggregates, Hypercore compression, retention policies
- **Ghostgres** — per-user isolated Postgres instances for stack profile isolation
- **.NET 8** — minimal API, Npgsql, async endpoints
- **Python** — async ingestion workers, COPY-based bulk insert
- **.React** — war room dashboard, live heatmap, chain graph, carbon dating UI
- **Electron** — cross-platform desktop installer with Keygen license gating

---

## Database stats

| Metric | Value |
|--------|-------|
| Total CVEs | 456,112+ |
| Critical severity | 34,687 |
| KEV confirmed | 1,964 |
| EPSS scored | 108,145 |
| DB chunks | 1,600+ |
| Compression savings | 88% |
| Ingestion speed | ~100k rows/sec via COPY |

---

## API endpoints
GET /health                     — service health
GET /api/metrics                — dashboard headline stats
GET /api/cves                   — live CVE feed with filters
GET /api/cves/{id}              — single CVE detail
GET /api/threats/top            — highest EPSS + KEV ranked
GET /api/heatmap                — 1h cagg data for war room
GET /api/carbon/{id}            — EPSS decay curve for carbon dating
---

## Access

Sentinel is not public software. Access is granted by the author on request.

**Request access:** [your email here]

---

## Note on service naming

Sentinel runs on a dedicated TimescaleDB service alongside the resonance project. Both share a single Timescale Cloud instance for credit efficiency during development. All Sentinel tables are isolated in their own schema.

---

*Built to impress the team at TigerData. Powered by TimescaleDB.*
