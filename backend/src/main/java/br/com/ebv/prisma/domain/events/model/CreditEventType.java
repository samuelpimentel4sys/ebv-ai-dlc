package br.com.ebv.prisma.domain.events.model;

import java.util.Locale;
import java.util.Objects;
import java.util.Set;

public enum CreditEventType {
    NEGATIVACAO,
    BAIXA,
    PROTESTO,
    PAGAMENTO;

    private static final Set<String> ALLOWED = Set.of(
            "NEGATIVACAO", "BAIXA", "PROTESTO", "PAGAMENTO"
    );

    public static CreditEventType parse(String raw) {
        Objects.requireNonNull(raw, "eventType");
        String normalized = raw.trim().toUpperCase(Locale.ROOT);
        if (!ALLOWED.contains(normalized)) {
            throw new IllegalArgumentException("eventType inválido: " + raw);
        }
        return CreditEventType.valueOf(normalized);
    }
}
