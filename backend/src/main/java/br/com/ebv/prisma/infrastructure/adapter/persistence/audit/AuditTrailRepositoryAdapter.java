package br.com.ebv.prisma.infrastructure.adapter.persistence.audit;

import br.com.ebv.prisma.domain.audit.port.out.AuditTrailRepositoryPort;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
@Transactional
public class AuditTrailRepositoryAdapter implements AuditTrailRepositoryPort {

    private final AuditEventJpaRepository eventJpa;
    private final AuditExportJpaRepository exportJpa;

    public AuditTrailRepositoryAdapter(AuditEventJpaRepository eventJpa, AuditExportJpaRepository exportJpa) {
        this.eventJpa = eventJpa;
        this.exportJpa = exportJpa;
    }

    @Override
    public void saveEvent(AuditEventRecord record) {
        AuditEventEntity e = new AuditEventEntity();
        e.setId(record.id());
        e.setDocumento(record.documento());
        e.setActorId(record.actorId());
        e.setEventType(record.eventType());
        e.setPayloadJson(record.payloadJson());
        e.setSha256(record.sha256());
        e.setPrevSha256(record.prevSha256());
        e.setCreatedAt(OffsetDateTime.ofInstant(record.createdAt(), ZoneOffset.UTC));
        eventJpa.save(e);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<String> findLatestSha256() {
        return eventJpa.findLatestSha256();
    }

    @Override
    @Transactional(readOnly = true)
    public PageResult search(
            String documento, String actorId, String eventType,
            java.time.Instant from, java.time.Instant to, int page, int size
    ) {
        OffsetDateTime fromTs = from == null ? null : OffsetDateTime.ofInstant(from, ZoneOffset.UTC);
        OffsetDateTime toTs = to == null ? null : OffsetDateTime.ofInstant(to, ZoneOffset.UTC);
        List<AuditEventEntity> all = eventJpa.search(
                blankToNull(documento), blankToNull(actorId), blankToNull(eventType), fromTs, toTs
        );
        long total = all.size();
        int fromIdx = Math.min(page * size, all.size());
        int toIdx = Math.min(fromIdx + size, all.size());
        List<AuditEventRecord> items = all.subList(fromIdx, toIdx).stream().map(this::toEvent).toList();
        int totalPages = size == 0 ? 0 : (int) Math.ceil((double) total / size);
        return new PageResult(items, page, size, total, totalPages);
    }

    @Override
    public void saveExport(AuditExportRecord record) {
        AuditExportEntity e = new AuditExportEntity();
        e.setId(record.id());
        e.setStatus(record.status());
        e.setFormat(record.format());
        e.setPurpose(record.purpose());
        e.setManifestHash(record.manifestHash());
        e.setRetentionUntil(record.retentionUntil());
        e.setRequestedAt(OffsetDateTime.ofInstant(record.requestedAt(), ZoneOffset.UTC));
        e.setFiltersJson(record.filtersJson());
        exportJpa.save(e);
    }

    private AuditEventRecord toEvent(AuditEventEntity e) {
        return new AuditEventRecord(
                e.getId(), e.getDocumento(), e.getActorId(), e.getEventType(),
                e.getPayloadJson(), e.getSha256(), e.getPrevSha256(), e.getCreatedAt().toInstant()
        );
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
