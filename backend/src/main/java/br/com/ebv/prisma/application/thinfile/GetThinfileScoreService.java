package br.com.ebv.prisma.application.thinfile;

import br.com.ebv.prisma.domain.thinfile.exception.ThinfileNotFoundException;
import br.com.ebv.prisma.domain.thinfile.exception.ThinfileValidationException;
import br.com.ebv.prisma.domain.thinfile.port.in.GetThinfileScoreUseCase;
import br.com.ebv.prisma.domain.thinfile.port.out.ThinfileRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GetThinfileScoreService implements GetThinfileScoreUseCase {

    private final ThinfileRepositoryPort repo;

    public GetThinfileScoreService(ThinfileRepositoryPort repo) { this.repo = repo; }

    @Override
    @Transactional(readOnly = true)
    public Result execute(Query query) {
        if (query.documento() == null || query.documento().isBlank()) {
            throw new ThinfileValidationException("documento obrigatório");
        }
        var score = repo.findLatestScore(CalculateThinfileScoreService.sha256(query.documento().trim()))
                .orElseThrow(() -> new ThinfileNotFoundException("score thin-file não encontrado"));
        return new Result(score.scoreId(), score.scoreValue(), score.confidenceBand(),
                score.modelVersion(), score.thinFileFlag());
    }
}
