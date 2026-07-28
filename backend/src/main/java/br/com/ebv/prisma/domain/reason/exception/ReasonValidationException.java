package br.com.ebv.prisma.domain.reason.exception;

public class ReasonValidationException extends RuntimeException {
    public ReasonValidationException(String message) {
        super(message);
    }
}
