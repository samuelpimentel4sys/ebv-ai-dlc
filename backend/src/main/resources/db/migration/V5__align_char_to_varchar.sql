-- Alinha CHAR → VARCHAR para Hibernate validate
ALTER TABLE tb_golden_record
  ALTER COLUMN canonical_documento TYPE VARCHAR(14)
  USING trim(canonical_documento);

ALTER TABLE tb_event_receipt
  ALTER COLUMN documento TYPE VARCHAR(14)
  USING trim(documento);
