package br.com.ebv.prisma.infrastructure.adapter.persistence;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

/**
 * PostgreSQL + Hibernate: {@code :ts IS NULL OR col <= :ts} falha com
 * "could not determine data type of parameter" quando o Instant chega null.
 * Sentinels tipados evitam o bind null.
 */
public final class PgNullableTime {
    private PgNullableTime() {}

    public static final OffsetDateTime FAR_FUTURE =
            OffsetDateTime.of(9999, 12, 31, 23, 59, 59, 0, ZoneOffset.UTC);
    public static final OffsetDateTime EPOCH =
            OffsetDateTime.ofInstant(Instant.EPOCH, ZoneOffset.UTC);

    public static OffsetDateTime upperBound(Instant value) {
        return value == null ? FAR_FUTURE : OffsetDateTime.ofInstant(value, ZoneOffset.UTC);
    }

    public static OffsetDateTime lowerBound(Instant value) {
        return value == null ? EPOCH : OffsetDateTime.ofInstant(value, ZoneOffset.UTC);
    }
}
