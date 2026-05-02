<div align="center">

# 🛡️ SENTINEL

### Real-time Temporal Threat Intelligence Engine

![TimescaleDB](https://img.shields.io/badge/TimescaleDB-2.26.3-orange?style=flat-square&logo=postgresql)
![.NET](https://img.shields.io/badge/.NET-8.0-purple?style=flat-square&logo=dotnet)
![Python](https://img.shields.io/badge/Python-3.12-blue?style=flat-square&logo=python)
![React](https://img.shields.io/badge/React-Vite-cyan?style=flat-square&logo=react)
![License](https://img.shields.io/badge/Access-By_Request_Only-red?style=flat-square)

> **The first threat intelligence engine built natively on TimescaleDB.**
> CVEs are not records. They are time-series events.

</div>

---

## 🧠 What makes Sentinel different?

Every existing CVE platform stores vulnerabilities as static records. Sentinel treats them as **time-series events** — tracking how dangerous each vulnerability becomes over time using EPSS trajectory, KEV confirmation, and temporal chain detection.

This is only possible with TimescaleDB.

> ⚠️ This product uses data from the NVD API but is not endorsed or certified by the NVD.

---

## 📡 Data Sources — 5 authoritative free feeds

| Source | What it provides | Authority |
|--------|-----------------|----------|
| 🏛️ NVD API v2 | 456k+ CVEs, CVSS scores, KEV fields | US Gov — nist.gov |
| 🚨 CISA KEV | Confirmed in-the-wild exploits | US Gov — cisa.gov |
| 📊 EPSS | 30-day exploit probability scores | FIRST.org |
| 🔍 OSV.dev | Ecosystem package vulnerabilities | Google |
| 🐙 GitHub Advisory | Supply chain vulnerabilities | GitHub |

---

## 🏗️ TimescaleDB Architecture



---

## ✨ Key Features

### ☢️ Carbon Dating
Every CVE gets an **exposure age** computed from your deployment date, weighted by EPSS using TimescaleDB  hyperfunction. See exactly how long a vulnerability has been sitting in your stack — down to the day.

### 🔗 Chain Risk Detection
TimescaleDB window functions detect CVEs that are exploited together within **72-hour windows** historically. Sentinel shows you the full attack chain — not just individual vulnerabilities.

### 🔎 Stack Scanner
Drop in a , , or . Sentinel resolves every dependency against OSV + NVD and returns a prioritised threat report enriched with EPSS scores and KEV flags — in under 1 second.

### 🔐 Cryptographic Integrity
Every ingestion batch gets a **SHA-256 hash** stored in the  hypertable. Users can verify their CVE data has not been tampered with.

### 📉 LEV Scoring
NIST 2025 Likely Exploited Vulnerabilities metric, computed natively using TimescaleDB hyperfunctions on historical EPSS snapshots.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| 🗄️ Database | TimescaleDB 2.26.3 — hypertables, caggs, Hypercore, retention |
| 👻 Isolation | Ghostgres — per-user isolated Postgres instances |
| ⚙️ API | .NET 8 minimal API — Npgsql, async, streaming |
| 🐍 Ingestion | Python 3.12 — asyncpg, COPY-based bulk insert |
| ⚛️ Frontend | React + Vite — war room, heatmap, chain graph |
| 📦 Desktop | Electron — cross-platform installer, Keygen license |

---

## 📊 Live Database Stats

| Metric | Value |
|--------|-------|
| Total CVEs ingested | **456,112+** |
| Critical severity | **34,687** |
| KEV confirmed exploited | **1,964** |
| EPSS scored | **108,145** |
| DB chunks | **1,600+** |
| Compression savings | **88%** |
| Ingestion speed | **~100k rows/sec** via COPY |

---

## 🔌 API Endpoints



---

## 📸 Screenshots

| TimescaleDB Explorer | CVE Hypertable | War Room Dashboard |
|---------------------|----------------|--------------------|
| ![](screenshots/01_timescaledb_explorer.png) | ![](screenshots/02_cve_events_hypertable.png) | coming soon |

---

## 🔒 Access

Sentinel is **not public software**. Access is granted by the author on request.

📧 **Request access:** sarthaknaikare@gmail.com

---

## 📝 Note on infrastructure

Sentinel runs on a dedicated TimescaleDB service alongside the  project, sharing a single Timescale Cloud instance for credit efficiency during development. All Sentinel tables are isolated in their own schema.

---

<div align="center">

*Built to impress the team at TigerData. Powered by TimescaleDB.*

**Sarthak Naikare** · sarthaknaikare@gmail.com

</div>
