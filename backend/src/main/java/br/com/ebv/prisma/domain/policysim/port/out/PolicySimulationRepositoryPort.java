package br.com.ebv.prisma.domain.policysim.port.out;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface PolicySimulationRepositoryPort {

    record SimulationRecord(
            UUID id,
            String candidatePolicyJson,
            String sampleRef,
            String status,
            String metricsJson,
            String resultJson,
            String baselineVersion,
            Instant createdAt,
            Instant finishedAt
    ) {}

    void save(SimulationRecord record);

    Optional<SimulationRecord> findById(UUID id);
}
