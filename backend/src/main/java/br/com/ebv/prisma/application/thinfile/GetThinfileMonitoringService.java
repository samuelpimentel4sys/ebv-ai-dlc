package br.com.ebv.prisma.application.thinfile;

import br.com.ebv.prisma.domain.thinfile.port.in.GetThinfileMonitoringUseCase;
import br.com.ebv.prisma.domain.thinfile.port.out.ThinfileRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GetThinfileMonitoringService implements GetThinfileMonitoringUseCase {

    private final ThinfileRepositoryPort repo;

    public GetThinfileMonitoringService(ThinfileRepositoryPort repo) { this.repo = repo; }

    @Override
    @Transactional(readOnly = true)
    public Result execute() {
        var items = repo.findMonitoringRuns().stream()
                .map(r -> new Item(r.runId(), r.modelVersion(), r.status(), r.aucCurrent(), r.degradationPct()))
                .toList();
        return new Result(items);
    }
}
