package br.com.ebv.prisma.domain.dispute.exception;

public class DisputeConflictException extends RuntimeException {
    public DisputeConflictException(String message) {
        super(message);
    }
}
