package br.com.ebv.prisma.application.subjectrequest;

import br.com.ebv.prisma.domain.subjectrequest.port.in.ListSubjectRequestsUseCase;
import br.com.ebv.prisma.domain.subjectrequest.port.out.SubjectRequestRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ListSubjectRequestsService implements ListSubjectRequestsUseCase {

    private final SubjectRequestRepositoryPort repo;

    public ListSubjectRequestsService(SubjectRequestRepositoryPort repo) {
        this.repo = repo;
    }

    @Override
    @Transactional(readOnly = true)
    public Page execute(Query query) {
        int page = Math.max(0, query.page());
        int size = query.size() <= 0 ? 20 : Math.min(query.size(), 100);
        var result = repo.search(query.rightType(), query.status(), query.dueBefore(), page, size);
        var items = result.items().stream()
                .map(r -> new Item(
                        r.id(), r.rightType(), r.subjectToken(), r.channel(), r.description(),
                        r.status(), r.dueAt(), r.responseSummary(), r.createdAt(), r.updatedAt()
                ))
                .toList();
        return new Page(items, result.page(), result.size(), result.totalElements(), result.totalPages());
    }
}
