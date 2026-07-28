package br.com.ebv.prisma.domain.decision.exception;

public class WormWriteException extends RuntimeException {
    public WormWriteException(String message) {
        super(message);
    }

    public WormWriteException(String message, Throwable cause) {
        super(message, cause);
    }
}
