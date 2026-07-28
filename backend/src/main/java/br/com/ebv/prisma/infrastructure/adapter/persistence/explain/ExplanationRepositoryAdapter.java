package br.com.ebv.prisma.infrastructure.adapter.persistence.explain;

import br.com.ebv.prisma.domain.explain.port.out.ExplanationRepositoryPort;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
@Transactional
public class ExplanationRepositoryAdapter implements ExplanationRepositoryPort {

    private final ExplanationJpaRepository jpa;

    public ExplanationRepositoryAdapter(ExplanationJpaRepository jpa) {
        this.jpa = jpa;
    }

    @Override
    public void save(ExplanationRecord record) {
        ExplanationEntity e = new ExplanationEntity();
        e.setDecisionId(record.decisionId());
        e.setBaseValue(record.baseValue());
        e.setFactorsJson(record.factorsJson());
        e.setModelVersion(record.modelVersion());
        e.setImmutable(record.immutable());
        e.setCreatedAt(OffsetDateTime.ofInstant(record.createdAt(), ZoneOffset.UTC));
        jpa.save(e);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<ExplanationRecord> findByDecisionId(UUID decisionId) {
        return jpa.findById(decisionId).map(this::toRecord);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExplanationRecord> findByDecisionIds(List<UUID> decisionIds) {
        return jpa.findByDecisionIdIn(decisionIds).stream().map(this::toRecord).toList();
    }

    private ExplanationRecord toRecord(ExplanationEntity e) {
        return new ExplanationRecord(
                e.getDecisionId(),
                e.getBaseValue(),
                e.getFactorsJson(),
                e.getModelVersion(),
                e.isImmutable(),
                e.getCreatedAt().toInstant()
        );
    }
}
