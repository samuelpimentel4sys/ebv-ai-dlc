package br.com.ebv.prisma.infrastructure.adapter.persistence.decision;

import br.com.ebv.prisma.domain.decision.port.out.DecisionRepositoryPort;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
@Transactional
public class DecisionRepositoryAdapter implements DecisionRepositoryPort {

    private final DecisionJpaRepository jpa;

    public DecisionRepositoryAdapter(DecisionJpaRepository jpa) {
        this.jpa = jpa;
    }

    @Override
    public void save(DecisionRecord record) {
        DecisionEntity e = new DecisionEntity();
        e.setDecisionId(record.decisionId());
        e.setDocumento(record.documento());
        e.setScore(record.score());
        e.setModelVersion(record.modelVersion());
        e.setOutcome(record.outcome());
        e.setSha256(record.sha256());
        e.setPrevSha256(record.prevSha256());
        e.setStorageUri(record.storageUri());
        e.setCreatedAt(OffsetDateTime.ofInstant(record.createdAt(), ZoneOffset.UTC));
        e.setLatencyMs(record.latencyMs());
        e.setDegradedFlags(
                record.degradedFlags() == null || record.degradedFlags().isEmpty()
                        ? null
                        : record.degradedFlags().toArray(String[]::new)
        );
        e.setClientId(record.clientId());
        e.setPartial(record.partial());
        e.setProductCode(record.productCode());
        e.setExplanationRef(record.explanationRef());
        e.setLockedUntil(record.lockedUntil());
        jpa.save(e);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<DecisionRecord> findById(UUID decisionId) {
        return jpa.findById(decisionId).map(this::toRecord);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<DecisionRecord> findLatestByDocumento(String documento) {
        return jpa.findLatestByDocumento(documento).map(this::toRecord);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<DecisionRecord> findBySha256(String sha256) {
        return jpa.findBySha256(sha256).map(this::toRecord);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<DecisionRecord> findPreviousByDocumento(String documento, Instant before) {
        return jpa.findPreviousByDocumento(documento, OffsetDateTime.ofInstant(before, ZoneOffset.UTC))
                .map(this::toRecord);
    }

    private DecisionRecord toRecord(DecisionEntity e) {
        List<String> flags = e.getDegradedFlags() == null
                ? List.of()
                : Arrays.asList(e.getDegradedFlags());
        return new DecisionRecord(
                e.getDecisionId(),
                e.getDocumento(),
                e.getScore(),
                e.getModelVersion(),
                e.getOutcome(),
                e.getSha256(),
                e.getPrevSha256(),
                e.getStorageUri(),
                e.getCreatedAt().toInstant(),
                e.getLatencyMs(),
                flags,
                e.getClientId(),
                e.isPartial(),
                e.getProductCode(),
                e.getExplanationRef(),
                e.getLockedUntil()
        );
    }
}
