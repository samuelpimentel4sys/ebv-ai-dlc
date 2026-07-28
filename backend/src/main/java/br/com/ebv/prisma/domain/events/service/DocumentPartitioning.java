package br.com.ebv.prisma.domain.events.service;

import java.nio.charset.StandardCharsets;
import java.util.Objects;

/** RN001 F01 — partition key = hash(documento) % partitions. */
public final class DocumentPartitioning {

    private DocumentPartitioning() {}

    public static int partitionFor(String documento, int partitionCount) {
        Objects.requireNonNull(documento, "documento");
        if (partitionCount < 1) {
            throw new IllegalArgumentException("partitionCount >= 1");
        }
        String digits = documento.replaceAll("\\D", "");
        if (digits.length() != 11 && digits.length() != 14) {
            throw new IllegalArgumentException("documento deve ter 11 ou 14 dígitos");
        }
        int hash = Math.floorMod(digits.hashCode(), partitionCount);
        return hash;
    }

    public static String partitionKey(String documento) {
        return documento.replaceAll("\\D", "");
    }

    public static byte[] keyBytes(String documento) {
        return partitionKey(documento).getBytes(StandardCharsets.UTF_8);
    }
}
