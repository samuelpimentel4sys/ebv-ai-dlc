package br.com.ebv.prisma.application.observability;

import br.com.ebv.prisma.domain.observability.exception.TraceForbiddenException;
import br.com.ebv.prisma.domain.observability.exception.TraceNotFoundException;
import br.com.ebv.prisma.domain.observability.port.in.GetDecisionTraceUseCase;
import br.com.ebv.prisma.domain.observability.port.out.ObservabilityRepositoryPort;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class GetDecisionTraceService implements GetDecisionTraceUseCase {

    private final ObservabilityRepositoryPort observabilityRepo;
    private final ObjectMapper objectMapper;

    public GetDecisionTraceService(ObservabilityRepositoryPort observabilityRepo, ObjectMapper objectMapper) {
        this.observabilityRepo = observabilityRepo;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional(readOnly = true)
    public TraceResult execute(UUID decisionId, String clientId) {
        var trace = observabilityRepo.findTrace(decisionId)
                .orElseThrow(() -> new TraceNotFoundException(decisionId));

        if (trace.expiresAt().isBefore(Instant.now())) {
            throw new TraceNotFoundException(decisionId);
        }

        // RN003 / CA-04: cross-tenant → 403
        if (clientId != null && !clientId.isBlank()
                && trace.clientId() != null
                && !clientId.equals(trace.clientId())) {
            throw new TraceForbiddenException("Cross-tenant: clientId não corresponde ao trace");
        }

        List<Map<String, Object>> spans = parseSpans(trace.spanJson());
        return new TraceResult(trace.decisionId(), trace.clientId(), spans, trace.createdAt(), trace.expiresAt());
    }

    private List<Map<String, Object>> parseSpans(String spanJson) {
        try {
            return objectMapper.readValue(spanJson, new TypeReference<>() {});
        } catch (Exception e) {
            return List.of(Map.of("raw", spanJson != null ? spanJson : ""));
        }
    }
}
