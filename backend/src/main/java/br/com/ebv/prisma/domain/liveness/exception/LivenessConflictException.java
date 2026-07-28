package br.com.ebv.prisma.domain.liveness.exception;

public class LivenessConflictException extends RuntimeException {
    public LivenessConflictException(String message) {
        super(message);
    }
}
