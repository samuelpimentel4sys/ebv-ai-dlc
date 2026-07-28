package br.com.ebv.prisma.application.dispute;

import br.com.ebv.prisma.domain.dispute.exception.DisputeForbiddenException;
import br.com.ebv.prisma.domain.dispute.exception.DisputeLockoutException;
import br.com.ebv.prisma.domain.dispute.exception.DisputeNotFoundException;
import br.com.ebv.prisma.domain.dispute.port.in.GetDisputeTrackingUseCase;
import br.com.ebv.prisma.domain.dispute.port.in.GetDisputeTimelineUseCase;
import br.com.ebv.prisma.domain.dispute.port.out.DisputeLockoutPort;
import br.com.ebv.prisma.domain.dispute.port.out.DisputeRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class DisputeTrackingService implements GetDisputeTrackingUseCase, GetDisputeTimelineUseCase {

    private final DisputeRepositoryPort repo;
    private final DisputeLockoutPort lockout;

    public DisputeTrackingService(DisputeRepositoryPort repo, DisputeLockoutPort lockout) {
        this.repo = repo;
        this.lockout = lockout;
    }

    @Override
    @Transactional(readOnly = true)
    public GetDisputeTrackingUseCase.Result execute(GetDisputeTrackingUseCase.Query query) {
        var dispute = requireConfirmed(query.protocol(), query.confirmDocumento());
        var events = repo.timelineByDisputeId(dispute.id());
        var preview = events.stream()
                .limit(5)
                .map(e -> new TimelinePreview(e.eventType(), e.at()))
                .toList();

        long daysRemaining = dispute.dueAt() == null ? 0
                : Math.max(0, ChronoUnit.DAYS.between(Instant.now(), dispute.dueAt()));

        String stage = stageOf(dispute.status());
        String nextAction = nextActionOf(dispute.status());
        String nextActor = nextActorOf(dispute.status());

        return new GetDisputeTrackingUseCase.Result(
                dispute.protocol(), stage, dispute.status(), dispute.dueAt(),
                daysRemaining, nextAction, nextActor, preview
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<GetDisputeTimelineUseCase.Event> execute(GetDisputeTimelineUseCase.Query query) {
        var dispute = requireConfirmed(query.protocol(), query.confirmDocumento());
        return repo.timelineByDisputeId(dispute.id()).stream()
                .map(e -> new GetDisputeTimelineUseCase.Event(e.eventType(), e.message(), e.actor(), e.at()))
                .toList();
    }

    private DisputeRepositoryPort.DisputeRecord requireConfirmed(String protocol, String confirmDocumento) {
        if (protocol == null || protocol.isBlank()) {
            throw new IllegalArgumentException("protocol obrigatório");
        }
        String lockKey = "tracking:" + protocol.trim().toUpperCase();
        if (lockout.isLocked(lockKey)) {
            throw new DisputeLockoutException(
                    "Bloqueado por tentativas inválidas até " + lockout.lockedUntil(lockKey));
        }

        var dispute = repo.findByProtocol(protocol.trim().toUpperCase())
                .or(() -> repo.findByProtocol(protocol.trim()))
                .orElseThrow(() -> new DisputeNotFoundException("Protocolo não encontrado: " + protocol));

        if (confirmDocumento != null && !confirmDocumento.isBlank()) {
            String confirm = confirmDocumento.replaceAll("\\D", "");
            String doc = dispute.documento();
            String last4 = doc.length() >= 4 ? doc.substring(doc.length() - 4) : doc;
            boolean ok = confirm.equals(last4) || confirm.equals(doc);
            if (!ok) {
                int attempts = lockout.registerFailure(lockKey);
                if (attempts >= 3) {
                    throw new DisputeLockoutException("3 tentativas inválidas — lockout 30 min");
                }
                throw new DisputeForbiddenException("Confirmação de documento inválida (" + attempts + "/3)");
            }
            lockout.reset(lockKey);
        }

        return dispute;
    }

    private static String stageOf(String status) {
        return switch (status) {
            case "OPEN" -> "RECEBIDA";
            case "IN_DILIGENCE" -> "EM_DILIGENCIA";
            case "RESOLVED_FAVOR_TITULAR", "RESOLVED_MAINTAIN" -> "CONCLUIDA";
            case "CANCELLED" -> "CANCELADA";
            default -> status;
        };
    }

    private static String nextActionOf(String status) {
        return switch (status) {
            case "OPEN" -> "Aguardar análise inicial";
            case "IN_DILIGENCE" -> "Aguardar resposta da fonte informante";
            case "RESOLVED_FAVOR_TITULAR", "RESOLVED_MAINTAIN" -> "Nenhuma — contestação encerrada";
            default -> "Consultar console";
        };
    }

    private static String nextActorOf(String status) {
        return switch (status) {
            case "OPEN" -> "ANALISTA";
            case "IN_DILIGENCE" -> "FONTE";
            default -> "NENHUM";
        };
    }
}
