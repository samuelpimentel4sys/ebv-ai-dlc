package br.com.ebv.prisma.domain.scoring.port.out;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface ScoreRepositoryPort {

    record CurrentScore(
            String documento,
            BigDecimal score,
            String modelVersion,
            Instant updatedAt
    ) {}

    record HistoryEntry(
            long id,
            String documento,
            BigDecimal score,
            String modelVersion,
            String reason,
            Instant at
    ) {}

    Optional<CurrentScore> findCurrent(String documento);

    void saveCurrent(String documento, BigDecimal score, String modelVersion);

    void saveHistory(String documento, BigDecimal score, String modelVersion, String reason);

    List<HistoryEntry> findHistory(String documento, int page, int size);

    long countHistory(String documento);
}
