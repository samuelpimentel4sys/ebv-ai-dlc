package br.com.ebv.prisma.domain.replay.exception;

import java.util.UUID;

public class ReplayConflictException extends RuntimeException {
    public ReplayConflictException(UUID jobId, String status) {
        super("Replay job não abortável no status " + status + ": " + jobId);
    }
}
