package br.com.ebv.prisma.domain.replay.exception;

public class ReplayForbiddenException extends RuntimeException {
    public ReplayForbiddenException(String message) {
        super(message);
    }
}
