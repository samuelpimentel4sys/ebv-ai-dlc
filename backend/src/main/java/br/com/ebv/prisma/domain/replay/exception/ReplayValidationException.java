package br.com.ebv.prisma.domain.replay.exception;

public class ReplayValidationException extends RuntimeException {
    public ReplayValidationException(String message) {
        super(message);
    }
}
