-- EP-02 F10 — Policy version governance (lab)
CREATE TABLE IF NOT EXISTS tb_policy_version (
    id UUID PRIMARY KEY,
    version VARCHAR(40) NOT NULL,
    status VARCHAR(20) NOT NULL,
    artifact_json TEXT NOT NULL,
    artifact_hash VARCHAR(128),
    author VARCHAR(120),
    approval_id VARCHAR(80),
    effective_at TIMESTAMPTZ,
    release_note TEXT,
    git_commit VARCHAR(40),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    immutable BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_policy_version_status ON tb_policy_version(status);
CREATE INDEX IF NOT EXISTS idx_policy_version_author ON tb_policy_version(author);
CREATE INDEX IF NOT EXISTS idx_policy_version_created ON tb_policy_version(created_at);

-- Seeds: 2 DRAFT + 1 PUBLISHED (lab)
INSERT INTO tb_policy_version (id, version, status, artifact_json, artifact_hash, author, approval_id, effective_at, release_note, git_commit, created_at, published_at, immutable)
VALUES
(
    'a1111111-1111-4111-8111-111111111101',
    'POL-2026.08.DRAFT.1',
    'DRAFT',
    '{"max_utilization":0.7,"min_score":650}',
    'bb3901502201de54ad2940572e58790595f807a8e7f08d378b61b6eddbf7d53d',
    'analyst.noah',
    NULL, NULL, NULL, NULL,
    '2026-07-20T12:00:00Z', NULL, FALSE
),
(
    'a1111111-1111-4111-8111-111111111102',
    'POL-2026.08.DRAFT.2',
    'DRAFT',
    '{"max_utilization":0.65,"min_score":680}',
    '16e4434745a13cea3cf7e89dd2ff6af170de6b443c8e4368a4d4ed474494b047',
    'analyst.sofia',
    NULL, NULL, NULL, NULL,
    '2026-07-22T12:00:00Z', NULL, FALSE
),
(
    'a1111111-1111-4111-8111-111111111103',
    'POL-2026.07.1',
    'PUBLISHED',
    '{"max_utilization":0.6,"min_score":700}',
    '46817818583da8b89781f188a3d9c1bb587192b59315e1a164e31633a038fd3e',
    'committee.lead',
    'COMMITTEE-2026-07-01',
    '2026-07-01T00:00:00Z',
    'Baseline lab published policy.',
    'lab000000000000000000000000000000000001',
    '2026-06-28T12:00:00Z',
    '2026-07-01T00:00:00Z',
    TRUE
);
