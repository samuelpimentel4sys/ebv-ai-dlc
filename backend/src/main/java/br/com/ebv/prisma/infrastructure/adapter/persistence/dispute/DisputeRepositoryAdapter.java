package br.com.ebv.prisma.infrastructure.adapter.persistence.dispute;

import br.com.ebv.prisma.domain.dispute.port.out.DisputeRepositoryPort;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
@Transactional
public class DisputeRepositoryAdapter implements DisputeRepositoryPort {

    private final DisputeJpaRepository jpa;
    private final DisputeTimelineJpaRepository timelineJpa;

    public DisputeRepositoryAdapter(DisputeJpaRepository jpa, DisputeTimelineJpaRepository timelineJpa) {
        this.jpa = jpa;
        this.timelineJpa = timelineJpa;
    }

    @Override
    public void save(DisputeRecord record) {
        DisputeEntity e = jpa.findById(record.id()).orElseGet(DisputeEntity::new);
        e.setId(record.id());
        e.setProtocol(record.protocol());
        e.setDocumento(record.documento());
        e.setStatus(record.status());
        e.setReasonCode(record.reasonCode());
        e.setDescription(record.description());
        e.setChannel(record.channel());
        e.setDueAt(record.dueAt() == null ? null : OffsetDateTime.ofInstant(record.dueAt(), ZoneOffset.UTC));
        e.setResolvedAt(record.resolvedAt() == null ? null : OffsetDateTime.ofInstant(record.resolvedAt(), ZoneOffset.UTC));
        e.setResolutionOutcome(record.resolutionOutcome());
        e.setResolutionRationale(record.resolutionRationale());
        e.setCreatedAt(OffsetDateTime.ofInstant(record.createdAt(), ZoneOffset.UTC));
        jpa.save(e);
    }

    @Override
    public void appendTimeline(UUID disputeId, String eventType, String message, String actor, java.time.Instant at) {
        DisputeTimelineEntity t = new DisputeTimelineEntity();
        t.setDisputeId(disputeId);
        t.setEventType(eventType);
        t.setMessage(message);
        t.setActor(actor);
        t.setAt(OffsetDateTime.ofInstant(at, ZoneOffset.UTC));
        timelineJpa.save(t);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<DisputeRecord> findById(UUID id) {
        return jpa.findById(id).map(this::toRecord);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<DisputeRecord> findByProtocol(String protocol) {
        return jpa.findByProtocol(protocol).map(this::toRecord);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResult queueByDueAt(int page, int size) {
        List<DisputeEntity> all = jpa.findQueueOrderedByDueAt();
        long total = all.size();
        int from = Math.min(page * size, all.size());
        int to = Math.min(from + size, all.size());
        List<DisputeRecord> items = all.subList(from, to).stream().map(this::toRecord).toList();
        int totalPages = size == 0 ? 0 : (int) Math.ceil((double) total / size);
        return new PageResult(items, page, size, total, totalPages);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TimelineEvent> timelineByDisputeId(UUID disputeId) {
        return timelineJpa.findByDisputeIdOrderByAtAsc(disputeId).stream()
                .map(t -> new TimelineEvent(
                        t.getId(), t.getDisputeId(), t.getEventType(), t.getMessage(),
                        t.getActor(), t.getAt().toInstant()))
                .toList();
    }

    private DisputeRecord toRecord(DisputeEntity e) {
        return new DisputeRecord(
                e.getId(), e.getProtocol(), e.getDocumento(), e.getStatus(),
                e.getReasonCode(), e.getDescription(), e.getChannel(),
                e.getDueAt() == null ? null : e.getDueAt().toInstant(),
                e.getResolvedAt() == null ? null : e.getResolvedAt().toInstant(),
                e.getResolutionOutcome(), e.getResolutionRationale(),
                e.getCreatedAt().toInstant()
        );
    }
}
