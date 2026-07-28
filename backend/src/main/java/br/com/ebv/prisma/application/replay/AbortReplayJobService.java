package br.com.ebv.prisma.application.replay;

import br.com.ebv.prisma.domain.replay.exception.ReplayConflictException;
import br.com.ebv.prisma.domain.replay.exception.ReplayNotFoundException;
import br.com.ebv.prisma.domain.replay.port.in.AbortReplayJobUseCase;
import br.com.ebv.prisma.domain.replay.port.out.ReplayJobRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

@Service
public class AbortReplayJobService implements AbortReplayJobUseCase {

    static final String STATUS_ABORTED = "ABORTED";
    static final String STATUS_DONE = "DONE";
    private static final Set<String> ABORTABLE = Set.of("QUEUED", "RUNNING");

    private final ReplayJobRepositoryPort replayRepo;

    public AbortReplayJobService(ReplayJobRepositoryPort replayRepo) {
        this.replayRepo = replayRepo;
    }

    @Override
    @Transactional
    public Result execute(UUID jobId) {
        var job = replayRepo.findById(jobId)
                .orElseThrow(() -> new ReplayNotFoundException(jobId));

        // RN004 / CA-06 — abort DONE → 409
        if (!ABORTABLE.contains(job.status())) {
            throw new ReplayConflictException(jobId, job.status());
        }

        Instant now = Instant.now();
        replayRepo.save(new ReplayJobRepositoryPort.ReplayJobRecord(
                job.id(),
                job.windowStart(),
                job.windowEnd(),
                STATUS_ABORTED,
                job.requester(),
                job.approver(),
                job.justification(),
                job.outputUri(),
                job.targetEnv(),
                job.createdAt(),
                now
        ));

        return new Result(jobId, STATUS_ABORTED);
    }
}
