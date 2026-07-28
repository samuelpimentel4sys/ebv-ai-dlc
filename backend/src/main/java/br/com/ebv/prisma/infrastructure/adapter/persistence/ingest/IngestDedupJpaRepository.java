package br.com.ebv.prisma.infrastructure.adapter.persistence.ingest;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.OffsetDateTime;

public interface IngestDedupJpaRepository extends JpaRepository<IngestDedupEntity, IngestDedupEntity.Pk> {
    boolean existsBySourceAndNaturalKeyAndEventTs(String source, String naturalKey, OffsetDateTime eventTs);

    java.util.Optional<IngestDedupEntity> findBySourceAndNaturalKeyAndEventTs(
            String source, String naturalKey, OffsetDateTime eventTs);

    java.util.List<IngestDedupEntity> findBySourceAndEventTsBetweenOrderByEventTsAsc(
            String source, OffsetDateTime from, OffsetDateTime to);

    long countBySourceAndEventTsGreaterThanEqual(String source, OffsetDateTime since);
}
