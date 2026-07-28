package br.com.ebv.prisma.application.review;

import br.com.ebv.prisma.domain.review.port.in.ListReviewQueueUseCase;
import br.com.ebv.prisma.domain.review.port.out.ReviewRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ListReviewQueueService implements ListReviewQueueUseCase {

    private final ReviewRepositoryPort reviewRepo;

    public ListReviewQueueService(ReviewRepositoryPort reviewRepo) {
        this.reviewRepo = reviewRepo;
    }

    @Override
    @Transactional(readOnly = true)
    public Page execute(Query query) {
        int page = Math.max(0, query.page());
        int size = query.size() <= 0 ? 20 : Math.min(query.size(), 100);
        var result = reviewRepo.search(query.status(), query.assignee(), query.dueBefore(), page, size);
        var items = result.items().stream()
                .map(r -> new Item(
                        r.id(), r.decisionId(), r.subjectToken(), r.reason(), r.channel(),
                        r.status(), r.assignee(), r.dueAt(), r.createdAt()
                ))
                .toList();
        return new Page(items, result.page(), result.size(), result.totalElements(), result.totalPages());
    }
}
