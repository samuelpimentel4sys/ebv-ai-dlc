package br.com.ebv.prisma.domain.explain.port.out;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ExplanationRepositoryPort {

    record ExplanationRecord(
            UUID decisionId,
            BigDecimal baseValue,
            String factorsJson,
            String modelVersion,
            boolean immutable,
            Instant createdAt
    ) {}

    void save(ExplanationRecord record);

    Optional<ExplanationRecord> findByDecisionId(UUID decisionId);

    List<ExplanationRecord> findByDecisionIds(List<UUID> decisionIds);
}
