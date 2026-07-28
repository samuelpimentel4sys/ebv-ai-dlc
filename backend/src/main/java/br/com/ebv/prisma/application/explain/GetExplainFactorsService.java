package br.com.ebv.prisma.application.explain;

import br.com.ebv.prisma.domain.explain.exception.ExplanationNotFoundException;
import br.com.ebv.prisma.domain.explain.port.in.GetExplainFactorsUseCase;
import br.com.ebv.prisma.domain.explain.port.in.GetExplanationUseCase;
import br.com.ebv.prisma.domain.explain.port.out.ExplanationRepositoryPort;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class GetExplainFactorsService implements GetExplainFactorsUseCase {

    private final ExplanationRepositoryPort explanationRepo;
    private final ObjectMapper objectMapper;

    public GetExplainFactorsService(ExplanationRepositoryPort explanationRepo, ObjectMapper objectMapper) {
        this.explanationRepo = explanationRepo;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional(readOnly = true)
    public Result execute(UUID decisionId, String direction, int limit) {
        String dir = ExplanationStubFactory.normalizeDirection(direction);
        if (dir == null) {
            throw new IllegalArgumentException("direction obrigatório (POSITIVE|NEGATIVE)");
        }
        int lim = limit <= 0 ? 10 : Math.min(limit, 20);

        var expl = explanationRepo.findByDecisionId(decisionId)
                .orElseThrow(() -> new ExplanationNotFoundException(decisionId));

        List<GetExplanationUseCase.Factor> all = ExplanationStubFactory.toDomainFactors(
                ExplanationStubFactory.parseFactors(objectMapper, expl.factorsJson()),
                true
        );
        List<GetExplanationUseCase.Factor> filtered = all.stream()
                .filter(f -> dir.equals(f.direction()))
                .limit(lim)
                .toList();

        return new Result(decisionId, dir, lim, filtered);
    }
}
