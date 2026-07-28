package br.com.ebv.prisma.domain.ingest.port.in;

import java.util.List;

public interface ListIngestSourcesUseCase {

    record SourceView(
            String sourceId,
            String sourceName,
            String health,
            String lastSuccessAt,
            long volumeToday,
            long expectedVolumeToday,
            double deviationPct,
            long pendingReplayQueue
    ) {}

    record SourcesResponse(List<SourceView> sources, String refreshedAt) {}

    SourcesResponse execute();
}
