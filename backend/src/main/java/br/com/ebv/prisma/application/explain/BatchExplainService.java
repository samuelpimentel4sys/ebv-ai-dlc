package br.com.ebv.prisma.application.explain;

import br.com.ebv.prisma.domain.explain.exception.ExplanationNotFoundException;
import br.com.ebv.prisma.domain.explain.port.in.BatchExplainUseCase;
import br.com.ebv.prisma.domain.explain.port.in.GetExplanationUseCase;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class BatchExplainService implements BatchExplainUseCase {

    public static final int MAX_BATCH = 100;

    private final GetExplanationUseCase getExplanation;

    public BatchExplainService(GetExplanationUseCase getExplanation) {
        this.getExplanation = getExplanation;
    }

    @Override
    @Transactional(readOnly = true)
    public Result execute(Command command) {
        if (command.decisionIds() == null || command.decisionIds().isEmpty()) {
            throw new IllegalArgumentException("decision_ids obrigatório");
        }
        if (command.decisionIds().size() > MAX_BATCH) {
            throw new IllegalArgumentException("decision_ids máximo " + MAX_BATCH);
        }

        List<GetExplanationUseCase.Result> items = new ArrayList<>();
        List<UUID> missing = new ArrayList<>();
        for (UUID id : command.decisionIds()) {
            try {
                var r = getExplanation.execute(id, true);
                if (!command.includeFactors()) {
                    r = new GetExplanationUseCase.Result(
                            r.decisionId(), r.modelVersion(), r.policyVersion(),
                            r.baseValue(), r.score(), r.snapshotHash(),
                            List.of(), r.generatedAt()
                    );
                }
                items.add(r);
            } catch (ExplanationNotFoundException ex) {
                missing.add(id);
            }
        }
        return new Result(items, missing);
    }
}
