package br.com.ebv.prisma.domain.pj.exception;

public class PjConflictException extends RuntimeException {
    public PjConflictException(String message) {
        super(message);
    }
}
