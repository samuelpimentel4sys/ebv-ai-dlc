package br.com.ebv.prisma.application.counterfactual;

import br.com.ebv.prisma.domain.counterfactual.exception.CounterfactualNotFoundException;
import br.com.ebv.prisma.domain.counterfactual.port.in.GetCounterfactualUseCase;
import br.com.ebv.prisma.domain.counterfactual.port.out.CounterfactualRepositoryPort;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class GetCounterfactualService implements GetCounterfactualUseCase {

    private final CounterfactualRepositoryPort repo;
    private final ObjectMapper objectMapper;

    public GetCounterfactualService(CounterfactualRepositoryPort repo, ObjectMapper objectMapper) {
        this.repo = repo;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional(readOnly = true)
    public Result execute(UUID decisionId, int maxActions) {
        int max = maxActions <= 0 ? 5 : Math.min(maxActions, 5);
        var record = repo.findByDecisionId(decisionId)
                .orElseThrow(() -> new CounterfactualNotFoundException(decisionId));

        List<Map<String, Object>> raw = CounterfactualStubFactory.parse(objectMapper, record.actionsJson());
        List<Action> actions = new ArrayList<>();
        for (Map<String, Object> m : raw) {
            if (actions.size() >= max) {
                break;
            }
            actions.add(new Action(
                    String.valueOf(m.get("attribute_code")),
                    m.get("from_value"),
                    m.get("to_value"),
                    m.get("effort") instanceof Number n ? n.intValue() : 1,
                    m.get("reason_code") != null ? String.valueOf(m.get("reason_code")) : null,
                    m.get("action_text") != null ? String.valueOf(m.get("action_text")) : null,
                    m.get("typical_effect_days") instanceof Number d ? d.intValue() : null
            ));
        }

        boolean viable = !actions.isEmpty();
        Map<String, Integer> range = new LinkedHashMap<>();
        if (viable) {
            range.put("min", 610);
            range.put("max", 635);
        }

        return new Result(
                decisionId,
                viable,
                range,
                actions,
                CounterfactualStubFactory.DISCLAIMER,
                viable ? null : "Sem contrafactual viável para esta decisão"
        );
    }
}
