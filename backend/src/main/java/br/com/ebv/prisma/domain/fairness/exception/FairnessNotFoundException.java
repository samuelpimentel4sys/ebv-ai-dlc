package br.com.ebv.prisma.domain.fairness.exception;

import java.util.UUID;

public class FairnessNotFoundException extends RuntimeException {
    public FairnessNotFoundException(UUID id) {
        super("Recurso de fairness não encontrado: " + id);
    }

    public FairnessNotFoundException(String message) {
        super(message);
    }
}
