package br.com.ebv.prisma.domain.pj.port.out;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PjHitlRepositoryPort {

    Optional<OpinionRecord> findOpinion(UUID opinionId);

    void updateOpinionStatus(UUID opinionId, String status);

    Optional<PolicyRecord> findPolicyForAmount(BigDecimal amount);

    List<PolicyRecord> listPoliciesOrdered();

    void appendTrail(TrailRecord trail);

    List<TrailRecord> listTrail(UUID opinionId);

    Optional<String> latestGuardrailStatus(UUID opinionId);

    record OpinionRecord(
            UUID id,
            String cnpj,
            String status,
            UUID createdBy,
            BigDecimal operationAmount,
            String currency
    ) {}

    record PolicyRecord(
            UUID id,
            BigDecimal minAmount,
            BigDecimal maxAmount,
            String levelCode,
            String roleRequired
    ) {}

    record TrailRecord(
            UUID id,
            UUID opinionId,
            String action,
            UUID actorId,
            String levelCode,
            String comment,
            Instant at
    ) {}
}
