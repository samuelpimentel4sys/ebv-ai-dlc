-- EP-06 F03 — Coach journey (lab)
CREATE TABLE IF NOT EXISTS tb_coach_journey (
    journey_id UUID PRIMARY KEY,
    documento_hash VARCHAR(64) NOT NULL,
    status VARCHAR(20) NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    decision_snapshot_id UUID,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tb_coach_goal (
    goal_id UUID PRIMARY KEY,
    journey_id UUID NOT NULL,
    goal_type VARCHAR(40) NOT NULL,
    title VARCHAR(200) NOT NULL,
    estimate_text VARCHAR(500) NOT NULL,
    guarantees_approval BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
