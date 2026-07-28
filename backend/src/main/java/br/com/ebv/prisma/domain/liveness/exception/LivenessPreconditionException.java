package br.com.ebv.prisma.domain.liveness.exception;

public class LivenessPreconditionException extends RuntimeException {
    public LivenessPreconditionException(String message) {
        super(message);
    }
}
