package br.com.ebv.prisma.domain.dispute.exception;

public class DisputeValidationException extends RuntimeException {
    public DisputeValidationException(String message) {
        super(message);
    }
}
