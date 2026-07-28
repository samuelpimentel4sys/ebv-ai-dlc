package br.com.ebv.prisma.domain.ingest.port.out;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

public interface IngestRepositoryPort {

    record SourceRecord(String code, String type, String status, OffsetDateTime lastSuccessAt) {}

    record ConsentRecord(String documento, String purpose, String status, OffsetDateTime expiresAt) {}

    record DedupRecord(String source, String naturalKey, OffsetDateTime eventTs, String payloadHash) {}

    List<SourceRecord> listSources();

    void touchSourceSuccess(String code);

    Optional<ConsentRecord> findConsent(String documento, String purpose);

    boolean existsDedup(String source, String naturalKey, OffsetDateTime eventTs);

    Optional<DedupRecord> findDedup(String source, String naturalKey, OffsetDateTime eventTs);

    List<DedupRecord> findDedupInWindow(String source, OffsetDateTime from, OffsetDateTime to);

    long countDedupSince(String source, OffsetDateTime since);

    void saveDedup(String source, String naturalKey, OffsetDateTime eventTs, String payloadHash);
}
