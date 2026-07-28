package br.com.ebv.prisma.domain.replay.exception;

import java.util.UUID;

public class ReplayNotFoundException extends RuntimeException {
    public ReplayNotFoundException(UUID jobId) {
        super("Replay job não encontrado: " + jobId);
    }
}
