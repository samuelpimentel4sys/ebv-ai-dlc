package br.com.ebv.prisma.domain.ingest.service;

import java.util.Objects;

/** RN002 — dedup Cad. Positivo / chave natural. */
public final class DedupDecisionService {

    public enum Outcome {
        PUBLISH,
        DEDUPLICATE,
        RECONCILE
    }

    private DedupDecisionService() {}

    /**
     * @param existingHash hash já persistido para (source, naturalKey, eventTs), ou null se ausente
     * @param incomingHash hash do payload atual
     */
    public static Outcome decide(String existingHash, String incomingHash) {
        Objects.requireNonNull(incomingHash, "incomingHash");
        if (existingHash == null || existingHash.isBlank()) {
            return Outcome.PUBLISH;
        }
        if (existingHash.equalsIgnoreCase(incomingHash)) {
            return Outcome.DEDUPLICATE;
        }
        return Outcome.RECONCILE;
    }
}
