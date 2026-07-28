package br.com.ebv.prisma.domain.sla.port.in;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface ListSlaEscalationsUseCase {

    record EscalationItem(UUID id, UUID disputeId, int level, Instant notifiedAt, String reason) {}

    List<EscalationItem> execute();
}
