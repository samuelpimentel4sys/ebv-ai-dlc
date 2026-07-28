-- Alinha payload_hash ao padrão Hibernate (VARCHAR), espelhando V5.
ALTER TABLE tb_ingest_dedup
    ALTER COLUMN payload_hash TYPE VARCHAR(64);
