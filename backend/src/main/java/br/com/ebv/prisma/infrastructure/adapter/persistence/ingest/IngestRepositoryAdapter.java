package br.com.ebv.prisma.infrastructure.adapter.persistence.ingest;

import br.com.ebv.prisma.domain.ingest.port.out.IngestRepositoryPort;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

@Component
@Transactional
public class IngestRepositoryAdapter implements IngestRepositoryPort {

    private final IngestSourceJpaRepository sourceJpa;
    private final IngestDedupJpaRepository dedupJpa;
    private final ConsentCacheJpaRepository consentJpa;

    public IngestRepositoryAdapter(
            IngestSourceJpaRepository sourceJpa,
            IngestDedupJpaRepository dedupJpa,
            ConsentCacheJpaRepository consentJpa
    ) {
        this.sourceJpa = sourceJpa;
        this.dedupJpa = dedupJpa;
        this.consentJpa = consentJpa;
    }

    @Override
    @Transactional(readOnly = true)
    public List<SourceRecord> listSources() {
        return sourceJpa.findAll().stream()
                .map(s -> new SourceRecord(s.getCode(), s.getType(), s.getStatus(), s.getLastSuccessAt()))
                .toList();
    }

    @Override
    public void touchSourceSuccess(String code) {
        sourceJpa.findById(code).ifPresent(s -> {
            s.setLastSuccessAt(OffsetDateTime.now(ZoneOffset.UTC));
            s.setStatus("UP");
            sourceJpa.save(s);
        });
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<ConsentRecord> findConsent(String documento, String purpose) {
        return consentJpa.findByDocumentoAndPurpose(documento, purpose)
                .map(c -> new ConsentRecord(c.getDocumento().trim(), c.getPurpose(), c.getStatus(), c.getExpiresAt()));
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsDedup(String source, String naturalKey, OffsetDateTime eventTs) {
        return dedupJpa.existsBySourceAndNaturalKeyAndEventTs(source, naturalKey, eventTs);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<DedupRecord> findDedup(String source, String naturalKey, OffsetDateTime eventTs) {
        return dedupJpa.findBySourceAndNaturalKeyAndEventTs(source, naturalKey, eventTs)
                .map(e -> new DedupRecord(e.getSource(), e.getNaturalKey(), e.getEventTs(), e.getPayloadHash().trim()));
    }

    @Override
    @Transactional(readOnly = true)
    public List<DedupRecord> findDedupInWindow(String source, OffsetDateTime from, OffsetDateTime to) {
        return dedupJpa.findBySourceAndEventTsBetweenOrderByEventTsAsc(source, from, to).stream()
                .map(e -> new DedupRecord(e.getSource(), e.getNaturalKey(), e.getEventTs(), e.getPayloadHash().trim()))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public long countDedupSince(String source, OffsetDateTime since) {
        return dedupJpa.countBySourceAndEventTsGreaterThanEqual(source, since);
    }

    @Override
    public void saveDedup(String source, String naturalKey, OffsetDateTime eventTs, String payloadHash) {
        IngestDedupEntity e = new IngestDedupEntity();
        e.setSource(source);
        e.setNaturalKey(naturalKey);
        e.setEventTs(eventTs);
        e.setPayloadHash(payloadHash);
        dedupJpa.save(e);
    }
}
