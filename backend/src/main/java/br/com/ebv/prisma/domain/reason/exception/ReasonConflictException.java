package br.com.ebv.prisma.domain.reason.exception;

public class ReasonConflictException extends RuntimeException {
    public ReasonConflictException(String message) {
        super(message);
    }
}
