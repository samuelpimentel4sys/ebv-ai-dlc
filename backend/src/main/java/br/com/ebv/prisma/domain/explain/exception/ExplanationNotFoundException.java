package br.com.ebv.prisma.domain.explain.exception;

import java.util.UUID;

public class ExplanationNotFoundException extends RuntimeException {

    public ExplanationNotFoundException(UUID decisionId) {
        super("Explicação não encontrada para decisão: " + decisionId);
    }
}
