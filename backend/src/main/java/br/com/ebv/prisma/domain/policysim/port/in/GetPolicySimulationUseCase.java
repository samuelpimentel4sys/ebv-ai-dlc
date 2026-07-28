package br.com.ebv.prisma.domain.policysim.port.in;

import java.time.Instant;
import java.util.UUID;

public interface GetPolicySimulationUseCase {

    record Result(
            UUID simulationId,
            String status,
            String candidatePolicyJson,
            String sampleRef,
            String baselineVersion,
            String metricsJson,
            String resultJson,
            Instant createdAt,
            Instant finishedAt
    ) {}

    Result execute(UUID id);
}
