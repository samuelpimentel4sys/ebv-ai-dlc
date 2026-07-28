package br.com.ebv.prisma.application.counterfactual;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Lab DiCE stub — actionable tips for REJECT/REVIEW. Real DiCE later.
 */
public final class CounterfactualStubFactory {

    public static final String DISCLAIMER = "LEGAL-CF-3";
    public static final int APPROVE_THRESHOLD = 700;

    private CounterfactualStubFactory() {}

    public static List<Map<String, Object>> buildStubActions(String outcome) {
        if ("APPROVE".equalsIgnoreCase(outcome)) {
            return List.of();
        }
        List<Map<String, Object>> actions = new ArrayList<>();
        actions.add(action("CREDIT_UTILIZATION", 0.84, 0.45, 1,
                "REDUCE_UTILIZATION",
                "Reduzir a utilização do limite para faixa entre 40% e 50%",
                35));
        actions.add(action("qtd_negativacoes", 3, 0, 2,
                "CLEAR_NEGATIVATIONS",
                "Regularizar negativações abertas no cadastro",
                60));
        actions.sort(Comparator.comparingInt(a -> ((Number) a.get("effort")).intValue()));
        return actions;
    }

    public static String toJson(ObjectMapper mapper, List<Map<String, Object>> actions) {
        try {
            return mapper.writeValueAsString(actions);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Falha serialização counterfactual stub", e);
        }
    }

    public static List<Map<String, Object>> parse(ObjectMapper mapper, String json) {
        try {
            return mapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            throw new IllegalStateException("Falha parse actions_json", e);
        }
    }

    private static Map<String, Object> action(
            String code, Object from, Object to, int effort,
            String reasonCode, String text, int days
    ) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("attribute_code", code);
        m.put("from_value", from);
        m.put("to_value", to);
        m.put("effort", effort);
        m.put("reason_code", reasonCode);
        m.put("action_text", text);
        m.put("typical_effect_days", days);
        return m;
    }
}
