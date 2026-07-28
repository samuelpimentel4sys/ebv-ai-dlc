package br.com.ebv.prisma.domain.liveness.exception;

public class LivenessProviderException extends RuntimeException {
    public LivenessProviderException(String message) {
        super(message);
    }

    public LivenessProviderException(String message, Throwable cause) {
        super(message, cause);
    }
}
