package br.com.ebv.prisma.presentation.dto.ingest;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.OffsetDateTime;

/** Contrato FE US-FE-01 IngestReplayRequest. Justification vazia → 403 (RN004/CT-06). */
public record ReplayIngestRequest(
        @NotBlank String sourceId,
        @NotNull OffsetDateTime windowStart,
        @NotNull OffsetDateTime windowEnd,
        String justification
) {}
