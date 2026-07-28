package br.com.ebv.prisma.application.thinfile;

import br.com.ebv.prisma.domain.thinfile.port.in.EvaluateThinfileMonitoringUseCase;
import br.com.ebv.prisma.domain.thinfile.port.out.ThinfileRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.UUID;

@Service
public class EvaluateThinfileMonitoringService implements EvaluateThinfileMonitoringUseCase {

    private final ThinfileRepositoryPort repo;

    public EvaluateThinfileMonitoringService(ThinfileRepositoryPort repo) { this.repo = repo; }

    @Override
    @Transactional
    public Result execute(Command command) {
        String version = command.modelVersion() != null ? command.modelVersion() : "tf-lab-1.0";
        BigDecimal auc = command.aucCurrent() != null ? command.aucCurrent() : new BigDecimal("0.70");
        BigDecimal baseline = new BigDecimal("0.72");
        BigDecimal deg = baseline.subtract(auc).divide(baseline, 4, RoundingMode.HALF_UP)
                .multiply(new BigDecimal("100"));
        String status = deg.compareTo(new BigDecimal("5")) > 0 ? "ALERT" : "OK";
        String action = status.equals("ALERT") ? "NOTIFY_MODEL_OPS" : "NONE";
        UUID runId = UUID.randomUUID();
        Instant now = Instant.now();
        repo.saveMonitoringRun(new ThinfileRepositoryPort.MonitoringRun(
                runId, version, now, now, status, auc, baseline, deg
        ));
        repo.saveDrift(new ThinfileRepositoryPort.DriftMetric(
                UUID.randomUUID(), runId, "punctuality_index", new BigDecimal("0.1200"),
                false, deg.compareTo(new BigDecimal("5")) > 0 ? "HIGH" : "LOW"
        ));
        return new Result(runId, status, deg, action);
    }
}
