package br.com.ebv.prisma.infrastructure.adapter.persistence.observability;

import br.com.ebv.prisma.domain.observability.port.out.ObservabilityRepositoryPort;
import br.com.ebv.prisma.infrastructure.adapter.persistence.decision.DecisionEntity;
import br.com.ebv.prisma.infrastructure.adapter.persistence.decision.DecisionJpaRepository;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
@Transactional
public class ObservabilityRepositoryAdapter implements ObservabilityRepositoryPort {

    private final DecisionTraceJpaRepository traceJpa;
    private final SloSnapshotJpaRepository snapshotJpa;
    private final DecisionJpaRepository decisionJpa;

    public ObservabilityRepositoryAdapter(
            DecisionTraceJpaRepository traceJpa,
            SloSnapshotJpaRepository snapshotJpa,
            DecisionJpaRepository decisionJpa
    ) {
        this.traceJpa = traceJpa;
        this.snapshotJpa = snapshotJpa;
        this.decisionJpa = decisionJpa;
    }

    @Override
    public void saveTrace(TraceRecord record) {
        DecisionTraceEntity e = new DecisionTraceEntity();
        e.setDecisionId(record.decisionId());
        e.setClientId(record.clientId());
        e.setSpanJson(record.spanJson());
        e.setCreatedAt(OffsetDateTime.ofInstant(record.createdAt(), ZoneOffset.UTC));
        e.setExpiresAt(OffsetDateTime.ofInstant(record.expiresAt(), ZoneOffset.UTC));
        traceJpa.save(e);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<TraceRecord> findTrace(UUID decisionId) {
        return traceJpa.findById(decisionId).map(e -> new TraceRecord(
                e.getDecisionId(),
                e.getClientId(),
                e.getSpanJson(),
                e.getCreatedAt().toInstant(),
                e.getExpiresAt().toInstant()
        ));
    }

    @Override
    @Transactional(readOnly = true)
    public List<LatencySample> findLatencies(Instant from, Instant to, String clientId) {
        OffsetDateTime fromOd = OffsetDateTime.ofInstant(from, ZoneOffset.UTC);
        OffsetDateTime toOd = OffsetDateTime.ofInstant(to, ZoneOffset.UTC);

        Specification<DecisionEntity> spec = (root, query, cb) -> {
            var preds = new ArrayList<jakarta.persistence.criteria.Predicate>();
            preds.add(cb.isNotNull(root.get("latencyMs")));
            preds.add(cb.greaterThanOrEqualTo(root.get("createdAt"), fromOd));
            preds.add(cb.lessThanOrEqualTo(root.get("createdAt"), toOd));
            if (clientId != null && !clientId.isBlank()) {
                preds.add(cb.equal(root.get("clientId"), clientId));
            }
            return cb.and(preds.toArray(jakarta.persistence.criteria.Predicate[]::new));
        };

        return decisionJpa.findAll(spec).stream()
                .map(e -> new LatencySample(
                        e.getLatencyMs(),
                        e.getClientId(),
                        e.getCreatedAt().toInstant()
                ))
                .toList();
    }

    @Override
    public void saveSloSnapshot(SloSnapshotRecord snapshot) {
        SloSnapshotEntity e = new SloSnapshotEntity();
        e.setAt(OffsetDateTime.ofInstant(snapshot.at(), ZoneOffset.UTC));
        e.setClientId(snapshot.clientId());
        e.setP95Ms(snapshot.p95Ms());
        e.setP99Ms(snapshot.p99Ms());
        e.setErrorRate(snapshot.errorRate());
        e.setBudgetRemainingPct(snapshot.budgetRemainingPct());
        snapshotJpa.save(e);
    }
}
