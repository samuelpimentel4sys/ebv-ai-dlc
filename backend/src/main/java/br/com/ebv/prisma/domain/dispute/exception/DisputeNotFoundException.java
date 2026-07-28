package br.com.ebv.prisma.domain.dispute.exception;

public class DisputeNotFoundException extends RuntimeException {
    public DisputeNotFoundException(String message) {
        super(message);
    }
}
