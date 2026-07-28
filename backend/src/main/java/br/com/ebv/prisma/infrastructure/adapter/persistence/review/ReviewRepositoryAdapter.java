package br.com.ebv.prisma.infrastructure.adapter.persistence.review;

import br.com.ebv.prisma.domain.review.port.out.ReviewRepositoryPort;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
@Transactional
public class ReviewRepositoryAdapter implements ReviewRepositoryPort {

    private final ReviewJpaRepository jpa;

    public ReviewRepositoryAdapter(ReviewJpaRepository jpa) {
        this.jpa = jpa;
    }

    @Override
    public void save(ReviewRecord record) {
        ReviewEntity e = new ReviewEntity();
        e.setId(record.id());
        e.setDecisionId(record.decisionId());
        e.setSubjectToken(record.subjectToken());
        e.setReason(record.reason());
        e.setChannel(record.channel());
        e.setStatus(record.status());
        e.setAssignee(record.assignee());
        e.setDueAt(OffsetDateTime.ofInstant(record.dueAt(), ZoneOffset.UTC));
        e.setOutcome(record.outcome());
        e.setRationale(record.rationale());
        e.setReviewedFactorsJson(record.reviewedFactorsJson());
        e.setCreatedAt(OffsetDateTime.ofInstant(record.createdAt(), ZoneOffset.UTC));
        e.setDecidedAt(record.decidedAt() == null ? null : OffsetDateTime.ofInstant(record.decidedAt(), ZoneOffset.UTC));
        jpa.save(e);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<ReviewRecord> findById(UUID id) {
        return jpa.findById(id).map(this::toRecord);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResult search(String status, String assignee, java.time.Instant dueBefore, int page, int size) {
        OffsetDateTime due = dueBefore == null ? null : OffsetDateTime.ofInstant(dueBefore, ZoneOffset.UTC);
        List<ReviewEntity> all = jpa.search(blankToNull(status), blankToNull(assignee), due);
        long total = all.size();
        int fromIdx = Math.min(page * size, all.size());
        int toIdx = Math.min(fromIdx + size, all.size());
        List<ReviewRecord> items = all.subList(fromIdx, toIdx).stream().map(this::toRecord).toList();
        int totalPages = size == 0 ? 0 : (int) Math.ceil((double) total / size);
        return new PageResult(items, page, size, total, totalPages);
    }

    private ReviewRecord toRecord(ReviewEntity e) {
        return new ReviewRecord(
                e.getId(), e.getDecisionId(), e.getSubjectToken(), e.getReason(), e.getChannel(),
                e.getStatus(), e.getAssignee(), e.getDueAt().toInstant(),
                e.getOutcome(), e.getRationale(), e.getReviewedFactorsJson(),
                e.getCreatedAt().toInstant(),
                e.getDecidedAt() == null ? null : e.getDecidedAt().toInstant()
        );
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
