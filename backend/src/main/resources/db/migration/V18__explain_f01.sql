-- EP-02 F01 — Explanation SHAP snapshot (lab stub; Python/SHAP later)
CREATE TABLE IF NOT EXISTS tb_explanation (
    decision_id UUID PRIMARY KEY,
    base_value NUMERIC(12,6),
    factors_json TEXT NOT NULL,
    model_version VARCHAR(40),
    immutable BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
