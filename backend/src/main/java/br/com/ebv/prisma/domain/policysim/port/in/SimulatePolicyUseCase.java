package br.com.ebv.prisma.domain.policysim.port.in;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface SimulatePolicyUseCase {

    record Command(Map<String, Object> candidatePolicy, String sampleRef, List<String> metrics) {}

    record Result(
            UUID simulationId,
            String status,
            String baselineVersion,
            String sampleRef,
            Instant submittedAt,
            Instant finishedAt
    ) {}

    Result execute(Command command);
}
