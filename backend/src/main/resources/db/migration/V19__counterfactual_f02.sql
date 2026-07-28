-- EP-02 F02 — Counterfactual actions (lab stub; DiCE later)
CREATE TABLE IF NOT EXISTS tb_counterfactual (
    decision_id UUID PRIMARY KEY,
    actions_json TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
