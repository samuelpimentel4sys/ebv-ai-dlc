package br.com.ebv.prisma.infrastructure.adapter.persistence.analytics;

import br.com.ebv.prisma.domain.analytics.port.out.AnalyticsRepositoryPort;
import br.com.ebv.prisma.infrastructure.adapter.persistence.dispute.DisputeJpaRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Component
@Transactional(readOnly = true)
public class AnalyticsRepositoryAdapter implements AnalyticsRepositoryPort {

    private final SacMetricJpaRepository metricJpa;
    private final DisputeJpaRepository disputeJpa;

    public AnalyticsRepositoryAdapter(SacMetricJpaRepository metricJpa, DisputeJpaRepository disputeJpa) {
        this.metricJpa = metricJpa;
        this.disputeJpa = disputeJpa;
    }

    @Override
    public List<SacMetricRecord> findByKey(String metricKey) {
        return metricJpa.findByMetricKeyOrderByPeriodToDesc(metricKey).stream()
                .map(this::toRecord)
                .toList();
    }

    @Override
    public Optional<SacMetricRecord> findLatestByKey(String metricKey) {
        return metricJpa.findFirstByMetricKeyOrderByPeriodToDesc(metricKey).map(this::toRecord);
    }

    @Override
    public long countOpenDisputes() {
        return disputeJpa.findQueueOrderedByDueAt().size();
    }

    @Override
    public long countResolvedDisputes() {
        return disputeJpa.findAll().stream().filter(d -> "RESOLVED".equals(d.getStatus())).count();
    }

    private SacMetricRecord toRecord(SacMetricEntity e) {
        return new SacMetricRecord(
                e.getId(), e.getMetricKey(), e.getChannel(),
                e.getPeriodFrom(), e.getPeriodTo(), e.getMetricValue(), e.getMetaJson()
        );
    }
}
