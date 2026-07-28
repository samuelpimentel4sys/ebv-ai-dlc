package br.com.ebv.prisma.domain.observability.exception;

public class TraceForbiddenException extends RuntimeException {
    public TraceForbiddenException(String message) {
        super(message);
    }
}
