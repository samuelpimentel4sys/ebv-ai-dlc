package br.com.ebv.prisma.domain.observability.port.in;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface GetDecisionTraceUseCase {

    record TraceResult(
            UUID decisionId,
            String clientId,
            List<Map<String, Object>> spans,
            Instant createdAt,
            Instant expiresAt
    ) {}

    TraceResult execute(UUID decisionId, String clientId);
}
