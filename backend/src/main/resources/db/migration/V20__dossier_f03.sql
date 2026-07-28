-- EP-02 F03 — Regulatory dossier (lab stub; PDFBox later)
CREATE TABLE IF NOT EXISTS tb_dossier (
    id UUID PRIMARY KEY,
    decision_id UUID NOT NULL,
    purpose VARCHAR(64) NOT NULL,
    legal_basis VARCHAR(64) NOT NULL,
    status VARCHAR(20) NOT NULL,
    formats TEXT NOT NULL,
    artifact_json TEXT,
    artifact_pdf_uri TEXT,
    manifest_hash VARCHAR(80),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_dossier_decision ON tb_dossier(decision_id);
CREATE INDEX IF NOT EXISTS idx_dossier_status ON tb_dossier(status);
