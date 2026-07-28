package br.com.ebv.prisma.domain.scoring.port.in;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public interface GetScoreUseCase {

    record ScoreSummary(
            String documento,
            BigDecimal score,
            String modelVersion,
            Instant updatedAt
    ) {}

    record HistoryEntry(
            BigDecimal score,
            String modelVersion,
            String reason,
            Instant at
    ) {}

    record ScoreHistoryPage(
            List<HistoryEntry> items,
            int page,
            int size,
            long total
    ) {}

    ScoreSummary getCurrent(String documento);

    ScoreHistoryPage getHistory(String documento, int page, int size);
}
