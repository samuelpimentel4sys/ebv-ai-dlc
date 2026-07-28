package br.com.ebv.prisma.domain.counterfactual.port.in;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface GetCounterfactualUseCase {

    Result execute(UUID decisionId, int maxActions);

    record Action(
            String attributeCode,
            Object fromValue,
            Object toValue,
            int effort,
            String reasonCode,
            String actionText,
            Integer typicalEffectDays
    ) {}

    record Result(
            UUID decisionId,
            boolean viable,
            Map<String, Integer> estimatedScoreRange,
            List<Action> actions,
            String disclaimerVersion,
            String failureReason
    ) {}
}
