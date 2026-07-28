package br.com.ebv.prisma.application.pj;

import br.com.ebv.prisma.domain.pj.exception.PjNotFoundException;
import br.com.ebv.prisma.domain.pj.port.in.GetPjApprovalTrailUseCase;
import br.com.ebv.prisma.domain.pj.port.out.PjHitlRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GetPjApprovalTrailService implements GetPjApprovalTrailUseCase {

    private final PjHitlRepositoryPort repo;

    public GetPjApprovalTrailService(PjHitlRepositoryPort repo) {
        this.repo = repo;
    }

    @Override
    @Transactional(readOnly = true)
    public Result execute(Query query) {
        repo.findOpinion(query.opinionId())
                .orElseThrow(() -> new PjNotFoundException("Parecer não encontrado: " + query.opinionId()));
        var items = repo.listTrail(query.opinionId()).stream()
                .map(t -> new TrailItem(t.id(), t.action(), t.actorId(), t.levelCode(), t.comment(), t.at()))
                .toList();
        return new Result(query.opinionId(), items);
    }
}
