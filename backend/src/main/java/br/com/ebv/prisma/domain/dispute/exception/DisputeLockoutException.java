package br.com.ebv.prisma.domain.dispute.exception;

public class DisputeLockoutException extends RuntimeException {
    public DisputeLockoutException(String message) {
        super(message);
    }
}
