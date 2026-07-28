package br.com.ebv.prisma.application.replay;

import br.com.ebv.prisma.domain.replay.exception.ReplayForbiddenException;
import br.com.ebv.prisma.domain.replay.exception.ReplayValidationException;
import br.com.ebv.prisma.domain.replay.port.in.CreateReplayJobUseCase;
import br.com.ebv.prisma.domain.replay.port.out.ReplayJobRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class CreateReplayJobService implements CreateReplayJobUseCase {

    static final String STATUS_QUEUED = "QUEUED";
    static final String STATUS_RUNNING = "RUNNING";
    static final UUID DEFAULT_REQUESTER = UUID.fromString("00000000-0000-4000-8000-000000000099");

    private static final Set<String> FORBIDDEN_ENVS = Set.of(
            "PRODUCTION_BUS", "PRODUCTION", "PROD"
    );

    private final ReplayJobRepositoryPort replayRepo;

    public CreateReplayJobService(ReplayJobRepositoryPort replayRepo) {
        this.replayRepo = replayRepo;
    }

    @Override
    @Transactional
    public Result execute(Command command) {
        // CA-03 / CT-03 — sem justificativa → 422
        if (command.justification() == null || command.justification().isBlank()) {
            throw new ReplayValidationException("justification obrigatória");
        }
        // CT-07 / RN002 — sem aprovador → 403
        if (command.approverId() == null || command.approverId().isBlank()) {
            throw new ReplayForbiddenException("approverId obrigatório — dual control");
        }

        String targetEnv = command.targetEnv() == null ? "" : command.targetEnv().trim();
        if (targetEnv.isEmpty()) {
            throw new ReplayValidationException("targetEnv obrigatório");
        }
        // RN001 / CA-02 — target prod bus → 403
        if (FORBIDDEN_ENVS.contains(targetEnv.toUpperCase(Locale.ROOT))) {
            throw new ReplayForbiddenException("targetEnv PRODUCTION_BUS proibido — isolamento sandbox");
        }

        if (command.windowStart() == null || command.windowEnd() == null
                || !command.windowStart().isBefore(command.windowEnd())) {
            throw new IllegalArgumentException("windowStart deve ser anterior a windowEnd");
        }

        UUID jobId = UUID.randomUUID();
        UUID approver = parseUuid(command.approverId());
        UUID requester = command.requester() != null ? command.requester() : DEFAULT_REQUESTER;
        Instant now = Instant.now();
        // RN003 / CT-08 — output URI auditável (sandbox isolado, sem prod)
        String outputUri = "s3://prisma-sandbox/replay/" + jobId + "/";

        replayRepo.save(new ReplayJobRepositoryPort.ReplayJobRecord(
                jobId,
                command.windowStart(),
                command.windowEnd(),
                STATUS_QUEUED,
                requester,
                approver,
                command.justification().trim(),
                outputUri,
                targetEnv.toUpperCase(Locale.ROOT),
                now,
                null
        ));

        return new Result(jobId, STATUS_QUEUED, targetEnv.toUpperCase(Locale.ROOT));
    }

    static UUID parseUuid(String raw) {
        try {
            return UUID.fromString(raw);
        } catch (IllegalArgumentException ex) {
            return UUID.nameUUIDFromBytes(raw.getBytes(StandardCharsets.UTF_8));
        }
    }
}
