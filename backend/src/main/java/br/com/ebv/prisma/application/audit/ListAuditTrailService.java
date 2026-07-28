package br.com.ebv.prisma.application.audit;

import br.com.ebv.prisma.domain.audit.port.in.ListAuditTrailUseCase;
import br.com.ebv.prisma.domain.audit.port.out.AuditTrailRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ListAuditTrailService implements ListAuditTrailUseCase {

    private final AuditTrailRepositoryPort repo;

    public ListAuditTrailService(AuditTrailRepositoryPort repo) {
        this.repo = repo;
    }

    @Override
    @Transactional(readOnly = true)
    public Page execute(Query query) {
        int page = Math.max(0, query.page());
        int size = query.size() <= 0 ? 20 : Math.min(query.size(), 100);
        var result = repo.search(
                query.documento(), query.actorId(), query.eventType(),
                query.from(), query.to(), page, size
        );
        var items = result.items().stream()
                .map(e -> new Item(
                        e.id(), e.documento(), e.actorId(), e.eventType(),
                        e.sha256(), e.prevSha256(), e.createdAt()
                ))
                .toList();
        return new Page(items, result.page(), result.size(), result.totalElements(), result.totalPages());
    }
}
