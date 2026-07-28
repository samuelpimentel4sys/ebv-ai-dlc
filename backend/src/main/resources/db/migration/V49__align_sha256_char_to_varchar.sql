-- Alinha CHAR(64) → VARCHAR(64) (Hibernate ddl-auto=validate)
ALTER TABLE tb_decision
  ALTER COLUMN sha256 TYPE VARCHAR(64) USING trim(sha256),
  ALTER COLUMN prev_sha256 TYPE VARCHAR(64) USING CASE WHEN prev_sha256 IS NULL THEN NULL ELSE trim(prev_sha256) END;

ALTER TABLE tb_dispute_attachment
  ALTER COLUMN sha256 TYPE VARCHAR(64) USING trim(sha256);
