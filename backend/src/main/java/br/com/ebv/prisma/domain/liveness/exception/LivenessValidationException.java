package br.com.ebv.prisma.domain.liveness.exception;

public class LivenessValidationException extends RuntimeException {
    public LivenessValidationException(String message) {
        super(message);
    }
}
