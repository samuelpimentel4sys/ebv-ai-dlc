package br.com.ebv.prisma.domain.decision.port.in;

import java.time.LocalDate;
import java.util.UUID;

public interface VerifyDecisionUseCase {

    record Result(
            UUID decisionId,
            String integrity,
            boolean chainValid,
            String sha256,
            LocalDate lockedUntil
    ) {}

    Result execute(UUID decisionId, boolean checkChain);
}
