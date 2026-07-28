package br.com.ebv.prisma.infrastructure.adapter.persistence.replay;

import br.com.ebv.prisma.domain.replay.port.out.ReplayJobRepositoryPort;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;

@Component
@Transactional
public class ReplayJobRepositoryAdapter implements ReplayJobRepositoryPort {

    private final ReplayJobJpaRepository jpa;

    public ReplayJobRepositoryAdapter(ReplayJobJpaRepository jpa) {
        this.jpa = jpa;
    }

    @Override
    public void save(ReplayJobRecord record) {
        ReplayJobEntity e = new ReplayJobEntity();
        e.setId(record.id());
        e.setWindowStart(OffsetDateTime.ofInstant(record.windowStart(), ZoneOffset.UTC));
        e.setWindowEnd(OffsetDateTime.ofInstant(record.windowEnd(), ZoneOffset.UTC));
        e.setStatus(record.status());
        e.setRequester(record.requester());
        e.setApprover(record.approver());
        e.setJustification(record.justification());
        e.setOutputUri(record.outputUri());
        e.setTargetEnv(record.targetEnv());
        e.setCreatedAt(OffsetDateTime.ofInstant(record.createdAt(), ZoneOffset.UTC));
        e.setFinishedAt(record.finishedAt() == null
                ? null
                : OffsetDateTime.ofInstant(record.finishedAt(), ZoneOffset.UTC));
        jpa.save(e);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<ReplayJobRecord> findById(UUID id) {
        return jpa.findById(id).map(e -> new ReplayJobRecord(
                e.getId(),
                e.getWindowStart().toInstant(),
                e.getWindowEnd().toInstant(),
                e.getStatus(),
                e.getRequester(),
                e.getApprover(),
                e.getJustification(),
                e.getOutputUri(),
                e.getTargetEnv(),
                e.getCreatedAt().toInstant(),
                e.getFinishedAt() == null ? null : e.getFinishedAt().toInstant()
        ));
    }
}
