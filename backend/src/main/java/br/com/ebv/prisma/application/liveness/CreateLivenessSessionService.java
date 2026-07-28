package br.com.ebv.prisma.application.liveness;

import br.com.ebv.prisma.domain.liveness.exception.LivenessConflictException;
import br.com.ebv.prisma.domain.liveness.exception.LivenessForbiddenException;
import br.com.ebv.prisma.domain.liveness.exception.LivenessLockoutException;
import br.com.ebv.prisma.domain.liveness.exception.LivenessPreconditionException;
import br.com.ebv.prisma.domain.liveness.exception.LivenessValidationException;
import br.com.ebv.prisma.domain.liveness.port.in.CreateLivenessSessionUseCase;
import br.com.ebv.prisma.domain.liveness.port.out.LivenessRepositoryPort;
import br.com.ebv.prisma.domain.liveness.port.out.RekognitionLivenessPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
public class CreateLivenessSessionService implements CreateLivenessSessionUseCase {

    private final LivenessRepositoryPort repo;
    private final RekognitionLivenessPort rekognition;

    public CreateLivenessSessionService(LivenessRepositoryPort repo, RekognitionLivenessPort rekognition) {
        this.repo = repo;
        this.rekognition = rekognition;
    }

    @Override
    @Transactional
    public Result execute(Command command) {
        if (command.customerId() == null) {
            throw new LivenessValidationException("customer_id obrigatório");
        }
        if (command.actorCustomerId() != null && !command.actorCustomerId().equals(command.customerId())) {
            throw new LivenessForbiddenException("customer_id não pertence ao titular autenticado");
        }
        if (!repo.hasActiveConsent(command.customerId())) {
            throw new LivenessPreconditionException("consentimento biométrico ACTIVE ausente (RN006)");
        }
        if (repo.hasActiveLockout(command.customerId())) {
            throw new LivenessLockoutException("cliente em lockout biométrico (RN002)");
        }

        if (command.idempotencyKey() != null && !command.idempotencyKey().isBlank()) {
            var hash = repo.findIdempotentPayloadHash(command.idempotencyKey());
            if (hash.isPresent()) {
                if (!hash.get().equals(command.payloadHash())) {
                    throw new LivenessConflictException("X-Idempotency-Key reutilizada com payload divergente (RN007)");
                }
                var cached = repo.findIdempotent(command.idempotencyKey())
                        .orElseThrow(() -> new LivenessConflictException("idempotency cache inconsistente"));
                return new Result(
                        cached.sessionId(), cached.customerId(), cached.status(),
                        cached.createdAt(), cached.expiresAt(), true
                );
            }
        }

        var created = rekognition.createSession(command.customerId(), command.idempotencyKey());
        Instant now = Instant.now();
        Instant expires = now.plus(3, ChronoUnit.MINUTES);
        var device = command.device() == null
                ? new DeviceInfo(null, null, null, null)
                : command.device();
        String channel = command.channel() == null || command.channel().isBlank() ? "MOBILE_APP" : command.channel();

        var saved = repo.saveSession(new LivenessRepositoryPort.SessionView(
                UUID.randomUUID(),
                created.sessionId(),
                command.customerId(),
                "CREATED",
                now,
                expires,
                channel,
                device.platform(),
                device.appVersion(),
                device.ipAddress()
        ));

        if (command.idempotencyKey() != null && !command.idempotencyKey().isBlank()) {
            repo.saveIdempotent(
                    command.idempotencyKey(),
                    command.payloadHash(),
                    new LivenessRepositoryPort.IdempotentPayload(
                            saved.sessionId(), saved.customerId(), saved.status(),
                            saved.createdAt(), saved.expiresAt()
                    )
            );
        }

        return new Result(
                saved.sessionId(), saved.customerId(), saved.status(),
                saved.createdAt(), saved.expiresAt(), false
        );
    }
}
