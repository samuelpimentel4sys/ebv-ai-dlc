package br.com.ebv.prisma.domain.pj.exception;

public class PjForbiddenException extends RuntimeException {
    public PjForbiddenException(String message) {
        super(message);
    }
}
