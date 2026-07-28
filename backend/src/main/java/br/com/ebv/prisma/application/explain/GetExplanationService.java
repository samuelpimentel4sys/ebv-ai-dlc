package br.com.ebv.prisma.application.explain;

import br.com.ebv.prisma.domain.decision.port.out.DecisionRepositoryPort;
import br.com.ebv.prisma.domain.explain.exception.ExplanationNotFoundException;
import br.com.ebv.prisma.domain.explain.port.in.GetExplanationUseCase;
import br.com.ebv.prisma.domain.explain.port.out.ExplanationRepositoryPort;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class GetExplanationService implements GetExplanationUseCase {

    static final String POLICY_VERSION_STUB = "POL-LAB-STUB";

    private final ExplanationRepositoryPort explanationRepo;
    private final DecisionRepositoryPort decisionRepo;
    private final ObjectMapper objectMapper;

    public GetExplanationService(
            ExplanationRepositoryPort explanationRepo,
            DecisionRepositoryPort decisionRepo,
            ObjectMapper objectMapper
    ) {
        this.explanationRepo = explanationRepo;
        this.decisionRepo = decisionRepo;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional(readOnly = true)
    public Result execute(UUID decisionId, boolean includeLabels) {
        var expl = explanationRepo.findByDecisionId(decisionId)
                .orElseThrow(() -> new ExplanationNotFoundException(decisionId));
        var decision = decisionRepo.findById(decisionId).orElse(null);

        List<Factor> factors = ExplanationStubFactory.toDomainFactors(
                ExplanationStubFactory.parseFactors(objectMapper, expl.factorsJson()),
                includeLabels
        );

        return new Result(
                decisionId,
                expl.modelVersion(),
                POLICY_VERSION_STUB,
                expl.baseValue(),
                decision != null ? decision.score() : null,
                decision != null ? "sha256:" + decision.sha256().substring(0, Math.min(12, decision.sha256().length())) : null,
                factors,
                expl.createdAt()
        );
    }
}
