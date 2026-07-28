package br.com.ebv.prisma.application.sla;

import br.com.ebv.prisma.domain.sla.port.in.GetSlaStatusUseCase;
import br.com.ebv.prisma.domain.sla.port.out.SlaRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class GetSlaStatusService implements GetSlaStatusUseCase {

    private static final Duration IDEMPOTENCY_WINDOW = Duration.ofHours(6);

    private final SlaRepositoryPort slaRepo;

    public GetSlaStatusService(SlaRepositoryPort slaRepo) {
        this.slaRepo = slaRepo;
    }

    @Override
    @Transactional
    public Result execute(Query query) {
        Instant now = Instant.now();
        int escalatePct = slaRepo.findActivePolicy()
                .map(SlaRepositoryPort.PolicyRecord::escalateAtPct)
                .orElse(80);

        long onTrack = 0;
        long atRisk = 0;
        long overdue = 0;
        List<AtRiskItem> sample = new ArrayList<>();
        int escalationsCreated = 0;

        for (SlaRepositoryPort.OpenDisputeSla d : slaRepo.listOpenDisputes()) {
            if (d.dueAt() == null || d.createdAt() == null) {
                onTrack++;
                continue;
            }
            long totalMs = Duration.between(d.createdAt(), d.dueAt()).toMillis();
            if (totalMs <= 0) {
                overdue++;
                escalationsCreated += maybeEscalate(d, 2, "OVERDUE", now);
                continue;
            }
            if (now.isAfter(d.dueAt())) {
                overdue++;
                escalationsCreated += maybeEscalate(d, 2, "OVERDUE", now);
                continue;
            }
            long elapsedMs = Duration.between(d.createdAt(), now).toMillis();
            double pct = (elapsedMs * 100.0) / totalMs;
            long daysRemaining = Duration.between(now, d.dueAt()).toDays();
            if (pct >= escalatePct) {
                atRisk++;
                if (sample.size() < 10) {
                    sample.add(new AtRiskItem(d.protocol(), daysRemaining, d.status(), "analista.lab"));
                }
                escalationsCreated += maybeEscalate(d, 1, "AT_RISK_" + escalatePct + "PCT", now);
            } else {
                onTrack++;
            }
        }

        return new Result(now, new Counts(onTrack, atRisk, overdue), sample, escalationsCreated);
    }

    private int maybeEscalate(SlaRepositoryPort.OpenDisputeSla d, int level, String reason, Instant now) {
        Instant since = now.minus(IDEMPOTENCY_WINDOW);
        if (slaRepo.hasRecentEscalation(d.id(), level, since)) {
            return 0;
        }
        slaRepo.saveEscalation(new SlaRepositoryPort.EscalationRecord(
                UUID.randomUUID(), d.id(), level, now, reason
        ));
        return 1;
    }
}
