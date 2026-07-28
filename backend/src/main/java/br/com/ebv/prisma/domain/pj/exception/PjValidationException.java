package br.com.ebv.prisma.domain.pj.exception;

public class PjValidationException extends RuntimeException {
    public PjValidationException(String message) {
        super(message);
    }
}
