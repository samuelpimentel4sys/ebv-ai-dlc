package br.com.ebv.prisma.domain.decision.exception;

public class SnapshotUnavailableException extends RuntimeException {
    public SnapshotUnavailableException(String message) {
        super(message);
    }
}
