package br.com.ebv.prisma.application.decision;

import br.com.ebv.prisma.domain.decision.port.in.GetBudgetUseCase;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class GetBudgetService implements GetBudgetUseCase {

    @Override
    public BudgetInfo execute() {
        Map<String, Integer> slices = new LinkedHashMap<>();
        slices.put("score", CreateDecisionService.SLICE_SCORE_MS);
        slices.put("features", CreateDecisionService.SLICE_FEATURES_MS);
        slices.put("worm", CreateDecisionService.SLICE_WORM_MS);
        slices.put("explanation", CreateDecisionService.SLICE_EXPLANATION_MS);
        return new BudgetInfo(CreateDecisionService.DEFAULT_BUDGET_MS, slices);
    }
}
