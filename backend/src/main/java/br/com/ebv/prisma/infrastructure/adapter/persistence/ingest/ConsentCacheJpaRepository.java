package br.com.ebv.prisma.infrastructure.adapter.persistence.ingest;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ConsentCacheJpaRepository extends JpaRepository<ConsentCacheEntity, ConsentCacheEntity.Pk> {
    Optional<ConsentCacheEntity> findByDocumentoAndPurpose(String documento, String purpose);
}
