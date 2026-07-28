package br.com.ebv.prisma.application.decision;

import br.com.ebv.prisma.domain.decision.exception.DecisionNotFoundException;
import br.com.ebv.prisma.domain.decision.port.in.GetDecisionUseCase;
import br.com.ebv.prisma.domain.decision.port.out.DecisionRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class GetDecisionService implements GetDecisionUseCase {

    private final DecisionRepositoryPort decisionRepo;

    public GetDecisionService(DecisionRepositoryPort decisionRepo) {
        this.decisionRepo = decisionRepo;
    }

    @Override
    @Transactional(readOnly = true)
    public DecisionRepositoryPort.DecisionRecord execute(UUID decisionId) {
        return decisionRepo.findById(decisionId)
                .orElseThrow(() -> new DecisionNotFoundException(decisionId));
    }
}
