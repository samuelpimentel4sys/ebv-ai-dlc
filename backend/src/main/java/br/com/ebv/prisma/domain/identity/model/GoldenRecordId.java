package br.com.ebv.prisma.domain.identity.model;

import java.util.Objects;
import java.util.UUID;

public record GoldenRecordId(UUID value) {
    public GoldenRecordId {
        Objects.requireNonNull(value, "GoldenRecordId nulo");
    }

    public static GoldenRecordId generate() {
        return new GoldenRecordId(UUID.randomUUID());
    }

    public static GoldenRecordId of(UUID value) {
        return new GoldenRecordId(value);
    }
}
