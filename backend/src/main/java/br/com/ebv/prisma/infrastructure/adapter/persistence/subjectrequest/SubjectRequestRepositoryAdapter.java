package br.com.ebv.prisma.infrastructure.adapter.persistence.subjectrequest;

import br.com.ebv.prisma.domain.subjectrequest.port.out.SubjectRequestRepositoryPort;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
@Transactional
public class SubjectRequestRepositoryAdapter implements SubjectRequestRepositoryPort {

    private final SubjectRequestJpaRepository jpa;

    public SubjectRequestRepositoryAdapter(SubjectRequestJpaRepository jpa) {
        this.jpa = jpa;
    }

    @Override
    public void save(SubjectRequestRecord record) {
        SubjectRequestEntity e = new SubjectRequestEntity();
        e.setId(record.id());
        e.setRightType(record.rightType());
        e.setSubjectToken(record.subjectToken());
        e.setChannel(record.channel());
        e.setDescription(record.description());
        e.setStatus(record.status());
        e.setDueAt(OffsetDateTime.ofInstant(record.dueAt(), ZoneOffset.UTC));
        e.setResponseSummary(record.responseSummary());
        e.setAttachmentId(record.attachmentId());
        e.setCreatedAt(OffsetDateTime.ofInstant(record.createdAt(), ZoneOffset.UTC));
        e.setUpdatedAt(OffsetDateTime.ofInstant(record.updatedAt(), ZoneOffset.UTC));
        jpa.save(e);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<SubjectRequestRecord> findById(UUID id) {
        return jpa.findById(id).map(this::toRecord);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResult search(String rightType, String status, java.time.Instant dueBefore, int page, int size) {
        OffsetDateTime due = dueBefore == null ? null : OffsetDateTime.ofInstant(dueBefore, ZoneOffset.UTC);
        List<SubjectRequestEntity> all = jpa.search(blankToNull(rightType), blankToNull(status), due);
        long total = all.size();
        int fromIdx = Math.min(page * size, all.size());
        int toIdx = Math.min(fromIdx + size, all.size());
        List<SubjectRequestRecord> items = all.subList(fromIdx, toIdx).stream().map(this::toRecord).toList();
        int totalPages = size == 0 ? 0 : (int) Math.ceil((double) total / size);
        return new PageResult(items, page, size, total, totalPages);
    }

    private SubjectRequestRecord toRecord(SubjectRequestEntity e) {
        return new SubjectRequestRecord(
                e.getId(), e.getRightType(), e.getSubjectToken(), e.getChannel(), e.getDescription(),
                e.getStatus(), e.getDueAt().toInstant(), e.getResponseSummary(), e.getAttachmentId(),
                e.getCreatedAt().toInstant(), e.getUpdatedAt().toInstant()
        );
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
