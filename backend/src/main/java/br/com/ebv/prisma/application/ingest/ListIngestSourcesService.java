package br.com.ebv.prisma.application.ingest;

import br.com.ebv.prisma.domain.ingest.port.in.ListIngestSourcesUseCase;
import br.com.ebv.prisma.domain.ingest.port.out.IngestRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;

@Service
public class ListIngestSourcesService implements ListIngestSourcesUseCase {

    private final IngestRepositoryPort ingestRepository;

    public ListIngestSourcesService(IngestRepositoryPort ingestRepository) {
        this.ingestRepository = ingestRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public SourcesResponse execute() {
        OffsetDateTime startOfDay = OffsetDateTime.now(ZoneOffset.UTC).toLocalDate().atStartOfDay().atOffset(ZoneOffset.UTC);
        var sources = ingestRepository.listSources().stream()
                .map(s -> {
                    long volume = ingestRepository.countDedupSince(s.code(), startOfDay);
                    long expected = Math.max(volume, 1);
                    double deviation = volume == 0 ? 100.0 : 0.0;
                    String health = mapHealth(s.status(), s.lastSuccessAt());
                    return new SourceView(
                            s.code(),
                            s.code(),
                            health,
                            s.lastSuccessAt() != null ? s.lastSuccessAt().toString() : null,
                            volume,
                            expected,
                            deviation,
                            0L
                    );
                })
                .toList();
        return new SourcesResponse(sources, OffsetDateTime.now(ZoneOffset.UTC).toString());
    }

    private static String mapHealth(String status, OffsetDateTime lastSuccess) {
        if ("DOWN".equalsIgnoreCase(status)) {
            return "DOWN";
        }
        if (lastSuccess == null) {
            return "DEGRADED";
        }
        if (lastSuccess.isBefore(OffsetDateTime.now(ZoneOffset.UTC).minusHours(24))) {
            return "DEGRADED";
        }
        return "HEALTHY";
    }
}
