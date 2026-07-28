package br.com.ebv.prisma.domain.liveness.exception;

public class LivenessForbiddenException extends RuntimeException {
    public LivenessForbiddenException(String message) {
        super(message);
    }
}
