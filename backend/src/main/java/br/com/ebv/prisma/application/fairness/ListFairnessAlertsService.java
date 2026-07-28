package br.com.ebv.prisma.application.fairness;

import br.com.ebv.prisma.domain.fairness.port.in.ListFairnessAlertsUseCase;
import br.com.ebv.prisma.domain.fairness.port.out.FairnessRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ListFairnessAlertsService implements ListFairnessAlertsUseCase {

    private final FairnessRepositoryPort fairnessRepo;

    public ListFairnessAlertsService(FairnessRepositoryPort fairnessRepo) {
        this.fairnessRepo = fairnessRepo;
    }

    @Override
    @Transactional(readOnly = true)
    public Page execute(Query query) {
        int page = Math.max(0, query.page());
        int size = query.size() <= 0 ? 20 : Math.min(query.size(), 100);
        var result = fairnessRepo.searchAlerts(query.severity(), query.status(), query.modelVersion(), page, size);
        var items = result.items().stream()
                .map(a -> new Item(
                        a.id(), a.metricId(), a.modelVersion(), a.severity(),
                        a.status(), a.message(), a.openedAt()
                ))
                .toList();
        return new Page(items, result.page(), result.size(), result.totalElements(), result.totalPages());
    }
}
