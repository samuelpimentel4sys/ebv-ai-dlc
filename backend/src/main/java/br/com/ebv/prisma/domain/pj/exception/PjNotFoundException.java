package br.com.ebv.prisma.domain.pj.exception;

public class PjNotFoundException extends RuntimeException {
    public PjNotFoundException(String message) {
        super(message);
    }
}
