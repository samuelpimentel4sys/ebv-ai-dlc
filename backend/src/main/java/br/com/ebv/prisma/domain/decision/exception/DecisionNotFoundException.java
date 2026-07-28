package br.com.ebv.prisma.domain.decision.exception;

import java.util.UUID;

public class DecisionNotFoundException extends RuntimeException {
    public DecisionNotFoundException(UUID decisionId) {
        super("Decisão não encontrada: " + decisionId);
    }
}
