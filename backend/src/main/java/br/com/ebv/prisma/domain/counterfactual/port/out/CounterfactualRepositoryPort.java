package br.com.ebv.prisma.domain.counterfactual.port.out;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface CounterfactualRepositoryPort {

    record CounterfactualRecord(
            UUID decisionId,
            String actionsJson,
            Instant createdAt
    ) {}

    void save(CounterfactualRecord record);

    Optional<CounterfactualRecord> findByDecisionId(UUID decisionId);
}
