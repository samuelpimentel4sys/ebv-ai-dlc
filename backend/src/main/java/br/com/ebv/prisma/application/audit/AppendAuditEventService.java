package br.com.ebv.prisma.application.audit;

import br.com.ebv.prisma.application.decision.SnapshotHash;
import br.com.ebv.prisma.domain.audit.exception.AuditWormWriteException;
import br.com.ebv.prisma.domain.audit.port.in.AppendAuditEventUseCase;
import br.com.ebv.prisma.domain.audit.port.out.AuditTrailRepositoryPort;
import br.com.ebv.prisma.domain.audit.port.out.AuditWormStoragePort;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class AppendAuditEventService implements AppendAuditEventUseCase {

    public static final String EVENT_DECISION_ISSUED = "DECISION_ISSUED";

    private final AuditTrailRepositoryPort repo;
    private final AuditWormStoragePort worm;
    private final ObjectMapper objectMapper;

    public AppendAuditEventService(
            AuditTrailRepositoryPort repo,
            AuditWormStoragePort worm,
            ObjectMapper objectMapper
    ) {
        this.repo = repo;
        this.worm = worm;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional
    public Result execute(Command command) {
        if (command.eventType() == null || command.eventType().isBlank()) {
            throw new IllegalArgumentException("event_type obrigatório");
        }
        UUID id = UUID.randomUUID();
        Instant now = Instant.now();
        String prev = repo.findLatestSha256().orElse(null);

        Map<String, Object> chainPayload = new LinkedHashMap<>();
        chainPayload.put("id", id.toString());
        chainPayload.put("documento", command.documento());
        chainPayload.put("actorId", command.actorId());
        chainPayload.put("eventType", command.eventType());
        chainPayload.put("payload", command.payload() == null ? Map.of() : command.payload());
        chainPayload.put("prevSha256", prev);
        chainPayload.put("createdAt", now.toString());

        String canonical = SnapshotHash.toCanonicalJson(objectMapper, chainPayload);
        String sha = SnapshotHash.sha256Hex(canonical);

        try {
            worm.put(id, canonical);
        } catch (AuditWormWriteException e) {
            throw e;
        } catch (Exception e) {
            throw new AuditWormWriteException("Falha gravação audit WORM: " + e.getMessage(), e);
        }

        String payloadJson;
        try {
            payloadJson = objectMapper.writeValueAsString(command.payload() == null ? Map.of() : command.payload());
        } catch (Exception e) {
            throw new IllegalStateException("Falha serialização payload audit", e);
        }

        repo.saveEvent(new AuditTrailRepositoryPort.AuditEventRecord(
                id, command.documento(), command.actorId(), command.eventType(),
                payloadJson, sha, prev, now
        ));

        return new Result(id, sha, prev);
    }
}
