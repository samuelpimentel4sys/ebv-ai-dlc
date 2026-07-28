package br.com.ebv.prisma.application.explain;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Lab SHAP stub — replaces Python TreeExplainer. Do not recalculate on GET.
 */
public final class ExplanationStubFactory {

    private static final Map<String, String> LABELS = Map.of(
            "divida_aberta", "Dívida em aberto",
            "qtd_negativacoes", "Quantidade de negativações",
            "UTILIZATION_90D", "Uso recente do limite",
            "CREDIT_UTILIZATION", "Utilização de crédito",
            "baseline", "Baseline do modelo"
    );

    private ExplanationStubFactory() {}

    public static List<Map<String, Object>> buildStubFactors(Map<String, Object> featuresSubset, BigDecimal score) {
        List<Map<String, Object>> factors = new ArrayList<>();

        Object divida = featureValue(featuresSubset, "divida_aberta");
        factors.add(factor("divida_aberta", divida != null ? divida : 1,
                new BigDecimal("-35.200000"), "NEGATIVE"));

        Object neg = featureValue(featuresSubset, "qtd_negativacoes");
        factors.add(factor("qtd_negativacoes", neg != null ? neg : 2,
                new BigDecimal("-28.500000"), "NEGATIVE"));

        Object util = featureValue(featuresSubset, "UTILIZATION_90D");
        if (util == null) {
            util = featureValue(featuresSubset, "CREDIT_UTILIZATION");
        }
        if (util != null) {
            factors.add(factor("UTILIZATION_90D", util, new BigDecimal("-47.300000"), "NEGATIVE"));
        }

        BigDecimal base = score != null ? score : new BigDecimal("600");
        factors.add(factor("baseline", base, new BigDecimal("42.100000"), "POSITIVE"));

        factors.sort(byMagnitudeDesc());
        return factors;
    }

    public static String toFactorsJson(ObjectMapper mapper, List<Map<String, Object>> factors) {
        try {
            return mapper.writeValueAsString(factors);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Falha serialização factors SHAP stub", e);
        }
    }

    public static List<Map<String, Object>> parseFactors(ObjectMapper mapper, String json) {
        try {
            return mapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            throw new IllegalStateException("Falha parse factors_json", e);
        }
    }

    public static List<br.com.ebv.prisma.domain.explain.port.in.GetExplanationUseCase.Factor> toDomainFactors(
            List<Map<String, Object>> raw, boolean includeLabels
    ) {
        List<br.com.ebv.prisma.domain.explain.port.in.GetExplanationUseCase.Factor> out = new ArrayList<>();
        for (Map<String, Object> m : raw) {
            String code = String.valueOf(m.get("attribute_code"));
            BigDecimal shap = toDecimal(m.get("shap_value"));
            String direction = String.valueOf(m.get("direction"));
            Object value = m.get("value");
            String label = includeLabels
                    ? (m.get("label") != null ? String.valueOf(m.get("label")) : LABELS.getOrDefault(code, code))
                    : null;
            if (includeLabels && m.get("business_label") != null) {
                label = String.valueOf(m.get("business_label"));
            } else if (includeLabels && label == null) {
                label = LABELS.getOrDefault(code, code);
            }
            out.add(new br.com.ebv.prisma.domain.explain.port.in.GetExplanationUseCase.Factor(
                    code, label, value, shap, direction
            ));
        }
        out.sort(Comparator.comparing(
                (br.com.ebv.prisma.domain.explain.port.in.GetExplanationUseCase.Factor f) ->
                        f.shapValue() == null ? BigDecimal.ZERO : f.shapValue().abs()
        ).reversed());
        return out;
    }

    private static Map<String, Object> factor(String code, Object value, BigDecimal shap, String direction) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("attribute_code", code);
        m.put("value", value);
        m.put("shap_value", shap);
        m.put("direction", direction);
        m.put("label", LABELS.getOrDefault(code, code));
        return m;
    }

    private static Object featureValue(Map<String, Object> features, String name) {
        if (features == null || !features.containsKey(name)) {
            return null;
        }
        Object raw = features.get(name);
        if (raw instanceof Map<?, ?> nested) {
            return nested.get("value");
        }
        return raw;
    }

    private static BigDecimal toDecimal(Object o) {
        if (o == null) {
            return BigDecimal.ZERO;
        }
        if (o instanceof BigDecimal bd) {
            return bd;
        }
        if (o instanceof Number n) {
            return BigDecimal.valueOf(n.doubleValue()).setScale(6, RoundingMode.HALF_UP);
        }
        return new BigDecimal(o.toString());
    }

    private static Comparator<Map<String, Object>> byMagnitudeDesc() {
        return Comparator.comparing(
                (Map<String, Object> m) -> toDecimal(m.get("shap_value")).abs()
        ).reversed();
    }

    public static String normalizeDirection(String direction) {
        if (direction == null || direction.isBlank()) {
            return null;
        }
        String d = direction.trim().toUpperCase(Locale.ROOT);
        if (!d.equals("POSITIVE") && !d.equals("NEGATIVE")) {
            throw new IllegalArgumentException("direction deve ser POSITIVE ou NEGATIVE");
        }
        return d;
    }
}
