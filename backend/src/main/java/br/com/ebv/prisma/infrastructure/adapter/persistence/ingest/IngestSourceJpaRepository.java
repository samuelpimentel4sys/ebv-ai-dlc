package br.com.ebv.prisma.infrastructure.adapter.persistence.ingest;

import org.springframework.data.jpa.repository.JpaRepository;

public interface IngestSourceJpaRepository extends JpaRepository<IngestSourceEntity, String> {
}
