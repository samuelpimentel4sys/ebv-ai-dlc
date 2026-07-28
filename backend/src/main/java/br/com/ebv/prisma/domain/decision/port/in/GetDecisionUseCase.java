package br.com.ebv.prisma.domain.decision.port.in;

import br.com.ebv.prisma.domain.decision.port.out.DecisionRepositoryPort;

import java.util.UUID;

public interface GetDecisionUseCase {

    DecisionRepositoryPort.DecisionRecord execute(UUID decisionId);
}
