package br.com.ebv.prisma.infrastructure.adapter.persistence.policysim;

import br.com.ebv.prisma.domain.policysim.port.out.PolicySimulationRepositoryPort;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;

@Component
@Transactional
public class PolicySimulationRepositoryAdapter implements PolicySimulationRepositoryPort {

    private final PolicySimulationJpaRepository jpa;

    public PolicySimulationRepositoryAdapter(PolicySimulationJpaRepository jpa) {
        this.jpa = jpa;
    }

    @Override
    public void save(SimulationRecord record) {
        PolicySimulationEntity e = new PolicySimulationEntity();
        e.setId(record.id());
        e.setCandidatePolicy(record.candidatePolicyJson());
        e.setSampleRef(record.sampleRef());
        e.setStatus(record.status());
        e.setMetricsJson(record.metricsJson());
        e.setResultJson(record.resultJson());
        e.setBaselineVersion(record.baselineVersion());
        e.setCreatedAt(OffsetDateTime.ofInstant(record.createdAt(), ZoneOffset.UTC));
        e.setFinishedAt(record.finishedAt() == null ? null : OffsetDateTime.ofInstant(record.finishedAt(), ZoneOffset.UTC));
        jpa.save(e);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<SimulationRecord> findById(UUID id) {
        return jpa.findById(id).map(e -> new SimulationRecord(
                e.getId(), e.getCandidatePolicy(), e.getSampleRef(), e.getStatus(),
                e.getMetricsJson(), e.getResultJson(), e.getBaselineVersion(),
                e.getCreatedAt().toInstant(),
                e.getFinishedAt() == null ? null : e.getFinishedAt().toInstant()
        ));
    }
}
