-- EP-04 F05 — Manutenção incremental cubos (lab stub; Trino/Iceberg fora)
CREATE TABLE IF NOT EXISTS tb_pf_cube_meta (
    cube_name VARCHAR(80) PRIMARY KEY,
    last_refresh_at TIMESTAMPTZ,
    freshness_sla_minutes INT NOT NULL DEFAULT 60,
    status VARCHAR(20) NOT NULL DEFAULT 'STALE'
);

CREATE TABLE IF NOT EXISTS tb_pf_cube_job (
    job_id VARCHAR(40) PRIMARY KEY,
    cube_name VARCHAR(80) NOT NULL,
    mode VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    partitions_json TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ
);

INSERT INTO tb_pf_cube_meta (cube_name, last_refresh_at, freshness_sla_minutes, status)
VALUES
  ('exposure_by_sector', NOW() - INTERVAL '30 minutes', 60, 'FRESH'),
  ('exposure_by_region', NOW() - INTERVAL '90 minutes', 60, 'STALE')
ON CONFLICT (cube_name) DO NOTHING;
