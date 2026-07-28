package br.com.ebv.prisma.application.fairness;

import br.com.ebv.prisma.domain.fairness.port.in.ListFairnessMetricsUseCase;
import br.com.ebv.prisma.domain.fairness.port.out.FairnessRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ListFairnessMetricsService implements ListFairnessMetricsUseCase {

    private final FairnessRepositoryPort fairnessRepo;

    public ListFairnessMetricsService(FairnessRepositoryPort fairnessRepo) {
        this.fairnessRepo = fairnessRepo;
    }

    @Override
    @Transactional(readOnly = true)
    public Page execute(Query query) {
        int page = Math.max(0, query.page());
        int size = query.size() <= 0 ? 20 : Math.min(query.size(), 100);
        var result = fairnessRepo.searchMetrics(
                query.modelVersion(), query.metric(), query.segment(),
                query.from(), query.to(), page, size
        );
        var items = result.items().stream()
                .map(m -> new Item(
                        m.id(), m.runId(), m.modelVersion(), m.metricName(), m.segmentName(),
                        m.groupCode(), m.metricValue(), m.approvedLimit(), m.exceeded(), m.createdAt()
                ))
                .toList();
        return new Page(items, result.page(), result.size(), result.totalElements(), result.totalPages());
    }
}
