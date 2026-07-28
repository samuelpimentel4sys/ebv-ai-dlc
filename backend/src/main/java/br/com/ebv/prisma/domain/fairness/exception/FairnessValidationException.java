package br.com.ebv.prisma.domain.fairness.exception;

public class FairnessValidationException extends RuntimeException {
    public FairnessValidationException(String message) {
        super(message);
    }
}
