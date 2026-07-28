-- EP-04 F08 — Geração dossiê executivo (lab stub; PDF/S3 fora)
CREATE TABLE IF NOT EXISTS tb_pf_report (
    report_id VARCHAR(40) PRIMARY KEY,
    portfolio_id UUID NOT NULL,
    title VARCHAR(200) NOT NULL,
    watermark_to VARCHAR(120),
    status VARCHAR(20) NOT NULL,
    sections_json TEXT,
    summary_json TEXT,
    download_url VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ
);
