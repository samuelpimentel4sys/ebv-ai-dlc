package br.com.ebv.prisma.domain.dispute.exception;

public class DisputeUnauthorizedException extends RuntimeException {
    public DisputeUnauthorizedException(String message) {
        super(message);
    }
}
