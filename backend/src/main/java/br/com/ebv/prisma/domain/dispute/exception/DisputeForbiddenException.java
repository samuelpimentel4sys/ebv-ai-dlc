package br.com.ebv.prisma.domain.dispute.exception;

public class DisputeForbiddenException extends RuntimeException {
    public DisputeForbiddenException(String message) {
        super(message);
    }
}
