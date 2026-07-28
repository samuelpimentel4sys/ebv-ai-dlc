package br.com.ebv.prisma.domain.sla.port.out;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SlaRepositoryPort {

    record PolicyRecord(
            UUID id, String name, int escalateAtPct, String notifyChannelsJson, String status, Instant createdAt
    ) {}

    record EscalationRecord(
            UUID id, UUID disputeId, int level, Instant notifiedAt, String reason
    ) {}

    record OpenDisputeSla(
            UUID id, String protocol, String status, Instant dueAt, Instant createdAt
    ) {}

    void savePolicy(PolicyRecord record);

    Optional<PolicyRecord> findActivePolicy();

    List<EscalationRecord> listEscalations();

    void saveEscalation(EscalationRecord record);

    boolean hasRecentEscalation(UUID disputeId, int level, Instant since);

    List<OpenDisputeSla> listOpenDisputes();
}
