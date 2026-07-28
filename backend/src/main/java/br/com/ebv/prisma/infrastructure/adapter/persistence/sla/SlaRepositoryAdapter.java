package br.com.ebv.prisma.infrastructure.adapter.persistence.sla;

import br.com.ebv.prisma.domain.sla.port.out.SlaRepositoryPort;
import br.com.ebv.prisma.infrastructure.adapter.persistence.dispute.DisputeEntity;
import br.com.ebv.prisma.infrastructure.adapter.persistence.dispute.DisputeJpaRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
@Transactional
public class SlaRepositoryAdapter implements SlaRepositoryPort {

    private final SlaPolicyJpaRepository policyJpa;
    private final SlaEscalationJpaRepository escalationJpa;
    private final DisputeJpaRepository disputeJpa;

    public SlaRepositoryAdapter(
            SlaPolicyJpaRepository policyJpa,
            SlaEscalationJpaRepository escalationJpa,
            DisputeJpaRepository disputeJpa
    ) {
        this.policyJpa = policyJpa;
        this.escalationJpa = escalationJpa;
        this.disputeJpa = disputeJpa;
    }

    @Override
    public void savePolicy(PolicyRecord record) {
        SlaPolicyEntity e = new SlaPolicyEntity();
        e.setId(record.id());
        e.setName(record.name());
        e.setEscalateAtPct(record.escalateAtPct());
        e.setNotifyChannels(record.notifyChannelsJson());
        e.setStatus(record.status());
        e.setCreatedAt(OffsetDateTime.ofInstant(record.createdAt(), ZoneOffset.UTC));
        policyJpa.save(e);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<PolicyRecord> findActivePolicy() {
        return policyJpa.findFirstByStatus("ACTIVE").map(e -> new PolicyRecord(
                e.getId(), e.getName(), e.getEscalateAtPct(), e.getNotifyChannels(),
                e.getStatus(), e.getCreatedAt().toInstant()
        ));
    }

    @Override
    @Transactional(readOnly = true)
    public List<EscalationRecord> listEscalations() {
        return escalationJpa.findAllByOrderByNotifiedAtDesc().stream()
                .map(e -> new EscalationRecord(
                        e.getId(), e.getDisputeId(), e.getLevel(),
                        e.getNotifiedAt().toInstant(), e.getReason()
                ))
                .toList();
    }

    @Override
    public void saveEscalation(EscalationRecord record) {
        SlaEscalationEntity e = new SlaEscalationEntity();
        e.setId(record.id());
        e.setDisputeId(record.disputeId());
        e.setLevel(record.level());
        e.setNotifiedAt(OffsetDateTime.ofInstant(record.notifiedAt(), ZoneOffset.UTC));
        e.setReason(record.reason());
        escalationJpa.save(e);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasRecentEscalation(UUID disputeId, int level, Instant since) {
        return escalationJpa.existsRecent(disputeId, level, OffsetDateTime.ofInstant(since, ZoneOffset.UTC));
    }

    @Override
    @Transactional(readOnly = true)
    public List<OpenDisputeSla> listOpenDisputes() {
        return disputeJpa.findQueueOrderedByDueAt().stream()
                .map(this::toOpen)
                .toList();
    }

    private OpenDisputeSla toOpen(DisputeEntity d) {
        return new OpenDisputeSla(
                d.getId(),
                d.getProtocol(),
                d.getStatus(),
                d.getDueAt() != null ? d.getDueAt().toInstant() : null,
                d.getCreatedAt() != null ? d.getCreatedAt().toInstant() : null
        );
    }
}
