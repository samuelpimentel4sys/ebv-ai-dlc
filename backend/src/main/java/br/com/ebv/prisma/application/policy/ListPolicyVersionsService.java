package br.com.ebv.prisma.application.policy;

import br.com.ebv.prisma.domain.policy.port.in.ListPolicyVersionsUseCase;
import br.com.ebv.prisma.domain.policy.port.out.PolicyVersionRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ListPolicyVersionsService implements ListPolicyVersionsUseCase {

    private final PolicyVersionRepositoryPort repo;

    public ListPolicyVersionsService(PolicyVersionRepositoryPort repo) {
        this.repo = repo;
    }

    @Override
    @Transactional(readOnly = true)
    public Page execute(Query query) {
        int page = Math.max(0, query.page());
        int size = query.size() <= 0 ? 20 : Math.min(query.size(), 100);
        var result = repo.search(query.status(), query.author(), query.from(), query.to(), page, size);
        var items = result.items().stream()
                .map(r -> new Item(
                        r.id(), r.version(), r.status(), r.artifactHash(), r.author(),
                        r.approvalId(), r.effectiveAt(), r.createdAt(), r.publishedAt(), r.immutable()
                ))
                .toList();
        return new Page(items, result.page(), result.size(), result.totalElements(), result.totalPages());
    }
}
