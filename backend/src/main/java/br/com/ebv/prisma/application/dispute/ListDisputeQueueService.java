package br.com.ebv.prisma.application.dispute;

import br.com.ebv.prisma.domain.dispute.port.in.ListDisputeQueueUseCase;
import br.com.ebv.prisma.domain.dispute.port.out.DisputeRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ListDisputeQueueService implements ListDisputeQueueUseCase {

    private final DisputeRepositoryPort repo;

    public ListDisputeQueueService(DisputeRepositoryPort repo) {
        this.repo = repo;
    }

    @Override
    @Transactional(readOnly = true)
    public Result execute(Query query) {
        int page = Math.max(0, query.page());
        int size = query.size() <= 0 ? 20 : Math.min(query.size(), 100);
        var pageResult = repo.queueByDueAt(page, size);
        var items = pageResult.items().stream()
                .map(r -> new Item(r.id(), r.protocol(), r.documento(), r.status(), r.dueAt(), r.createdAt()))
                .toList();
        return new Result(items, pageResult.page(), pageResult.size(), pageResult.totalElements(), pageResult.totalPages());
    }
}
