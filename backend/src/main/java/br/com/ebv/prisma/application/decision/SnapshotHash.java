package br.com.ebv.prisma.application.decision;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Map;
import java.util.TreeMap;

/**
 * Canonical SHA-256 for WORM snapshot chain (sorted keys, stable JSON).
 */
public final class SnapshotHash {

    private SnapshotHash() {}

    public static String sha256Canonical(ObjectMapper mapper, Map<String, Object> payload) {
        try {
            ObjectMapper sorted = mapper.copy()
                    .configure(SerializationFeature.ORDER_MAP_ENTRIES_BY_KEYS, true);
            String json = sorted.writeValueAsString(new TreeMap<>(payload));
            return sha256Hex(json);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Falha serialização canônica do snapshot", e);
        }
    }

    public static String sha256Hex(String canonicalJson) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(canonicalJson.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 indisponível", e);
        }
    }

    public static String toCanonicalJson(ObjectMapper mapper, Map<String, Object> payload) {
        try {
            ObjectMapper sorted = mapper.copy()
                    .configure(SerializationFeature.ORDER_MAP_ENTRIES_BY_KEYS, true);
            return sorted.writeValueAsString(new TreeMap<>(payload));
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Falha serialização canônica do snapshot", e);
        }
    }
}
