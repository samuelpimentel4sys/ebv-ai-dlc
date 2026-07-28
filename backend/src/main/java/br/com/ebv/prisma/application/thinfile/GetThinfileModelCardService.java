package br.com.ebv.prisma.application.thinfile;

import br.com.ebv.prisma.domain.thinfile.exception.ThinfileNotFoundException;
import br.com.ebv.prisma.domain.thinfile.port.in.GetThinfileModelCardUseCase;
import br.com.ebv.prisma.domain.thinfile.port.out.ThinfileRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GetThinfileModelCardService implements GetThinfileModelCardUseCase {

    private final ThinfileRepositoryPort repo;

    public GetThinfileModelCardService(ThinfileRepositoryPort repo) { this.repo = repo; }

    @Override
    @Transactional(readOnly = true)
    public Result execute() {
        var card = repo.findActiveModelCard()
                .orElseThrow(() -> new ThinfileNotFoundException("model card não encontrado"));
        return new Result(card.modelVersion(), card.populationDesc(), card.auc(),
                card.confidenceFloor(), card.active());
    }
}
