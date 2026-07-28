package br.com.ebv.prisma.application.replay;

import br.com.ebv.prisma.domain.replay.exception.ReplayNotFoundException;
import br.com.ebv.prisma.domain.replay.port.in.GetReplayJobUseCase;
import br.com.ebv.prisma.domain.replay.port.out.ReplayJobRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class GetReplayJobService implements GetReplayJobUseCase {

    private final ReplayJobRepositoryPort replayRepo;

    public GetReplayJobService(ReplayJobRepositoryPort replayRepo) {
        this.replayRepo = replayRepo;
    }

    @Override
    @Transactional(readOnly = true)
    public Result execute(UUID jobId) {
        var job = replayRepo.findById(jobId)
                .orElseThrow(() -> new ReplayNotFoundException(jobId));
        return new Result(
                job.id(),
                job.windowStart(),
                job.windowEnd(),
                job.status(),
                job.targetEnv(),
                job.outputUri(),
                job.justification(),
                job.createdAt(),
                job.finishedAt()
        );
    }
}
