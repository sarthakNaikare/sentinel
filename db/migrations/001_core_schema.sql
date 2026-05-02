-- SENTINEL core schema
-- Run once against your TimescaleDB instance

CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Sources table
CREATE TABLE IF NOT EXISTS sources (
    id          SMALLINT PRIMARY KEY,
    name        TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO sources (id, name, description) VALUES
    (1, 'nvd',             'NIST National Vulnerability Database API v2'),
    (2, 'cisa_kev',        'CISA Known Exploited Vulnerabilities Catalog'),
    (3, 'osv',             'Google Open Source Vulnerabilities'),
    (4, 'github_advisory', 'GitHub Advisory Database'),
    (5, 'epss',            'FIRST.org Exploit Prediction Scoring System')
ON CONFLICT (id) DO NOTHING;

-- CVE hypertable
CREATE TABLE IF NOT EXISTS cve_events (
    published_at        TIMESTAMPTZ  NOT NULL,
    cve_id              TEXT         NOT NULL,
    source_id           SMALLINT     NOT NULL REFERENCES sources(id),
    cvss_score          NUMERIC(4,1),
    cvss_vector         TEXT,
    severity            TEXT,
    epss_score          NUMERIC(7,6),
    epss_percentile     NUMERIC(7,6),
    is_kev              BOOLEAN      DEFAULT FALSE,
    kev_added_date      DATE,
    exploit_available   BOOLEAN      DEFAULT FALSE,
    affected_packages   TEXT[],
    affected_ecosystems TEXT[],
    cpe_matches         TEXT[],
    description         TEXT,
    patch_available     BOOLEAN      DEFAULT FALSE,
    patched_versions    TEXT[],
    updated_at          TIMESTAMPTZ  DEFAULT NOW(),
    raw_data            JSONB
);

SELECT create_hypertable('cve_events', 'published_at',
    chunk_time_interval => INTERVAL '7 days',
    if_not_exists => TRUE);

-- EPSS snapshots hypertable
CREATE TABLE IF NOT EXISTS epss_snapshots (
    snapshot_date   DATE         NOT NULL,
    cve_id          TEXT         NOT NULL,
    epss_score      NUMERIC(7,6) NOT NULL,
    epss_percentile NUMERIC(7,6),
    ingested_at     TIMESTAMPTZ  DEFAULT NOW()
);

SELECT create_hypertable('epss_snapshots', 'snapshot_date',
    chunk_time_interval => INTERVAL '30 days',
    if_not_exists => TRUE);

-- Ingestion log hypertable
CREATE TABLE IF NOT EXISTS ingestion_log (
    logged_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source_id       SMALLINT    NOT NULL REFERENCES sources(id),
    batch_hash      TEXT        NOT NULL,
    rows_ingested   INTEGER     NOT NULL,
    cve_ids         TEXT[],
    status          TEXT        DEFAULT 'success',
    error_msg       TEXT,
    duration_ms     INTEGER
);

SELECT create_hypertable('ingestion_log', 'logged_at',
    chunk_time_interval => INTERVAL '30 days',
    if_not_exists => TRUE);

-- User stacks table
CREATE TABLE IF NOT EXISTS user_stacks (
    stack_id        UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    name            TEXT        NOT NULL,
    packages        JSONB       NOT NULL,
    ghost_conn_str  TEXT,
    last_scanned_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cve_events_cve_id
    ON cve_events (cve_id, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_cve_events_severity
    ON cve_events (severity, published_at DESC)
    WHERE severity IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cve_events_packages
    ON cve_events USING GIN (affected_packages);

CREATE INDEX IF NOT EXISTS idx_cve_events_kev
    ON cve_events (is_kev, published_at DESC)
    WHERE is_kev = TRUE;

CREATE INDEX IF NOT EXISTS idx_cve_events_epss
    ON cve_events (epss_score DESC, published_at DESC)
    WHERE epss_score IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_epss_snapshots_pk
    ON epss_snapshots (cve_id, snapshot_date DESC);

-- Compression policies
ALTER TABLE cve_events SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'severity, is_kev',
    timescaledb.compress_orderby   = 'published_at DESC'
);

SELECT add_compression_policy('cve_events',
    compress_after => INTERVAL '7 days',
    if_not_exists  => TRUE);

ALTER TABLE epss_snapshots SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'cve_id',
    timescaledb.compress_orderby   = 'snapshot_date DESC'
);

SELECT add_compression_policy('epss_snapshots',
    compress_after => INTERVAL '60 days',
    if_not_exists  => TRUE);

-- Retention policies
SELECT add_retention_policy('cve_events',
    drop_after => INTERVAL '2 years', if_not_exists => TRUE);

SELECT add_retention_policy('epss_snapshots',
    drop_after => INTERVAL '3 years', if_not_exists => TRUE);

SELECT add_retention_policy('ingestion_log',
    drop_after => INTERVAL '1 year',  if_not_exists => TRUE);
