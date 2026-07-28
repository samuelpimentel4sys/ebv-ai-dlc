package br.com.ebv.prisma.domain.policy.port.in;

import java.time.Instant;
import java.util.UUID;

public interface PublishPolicyVersionUseCase {

    record Command(
            UUID id,
            String approvalId,
            Instant effectiveAt,
            String releaseNote,
            String expectedDraftHash
    ) {}

    record Result(
            UUID policyVersionId,
            String version,
            String status,
            String artifactHash,
            String gitCommit,
            String approvedBy,
            Instant effectiveAt
    ) {}

    Result execute(Command command);
}
