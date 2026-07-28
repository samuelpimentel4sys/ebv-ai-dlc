package br.com.ebv.prisma.domain.liveness.exception;

public class LivenessLockoutException extends RuntimeException {
    public LivenessLockoutException(String message) {
        super(message);
    }
}
