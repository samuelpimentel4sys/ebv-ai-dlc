package br.com.ebv.prisma.presentation.dto.explain;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

public record BatchExplainRequest(
        @NotEmpty
        @Size(max = 100)
        List<UUID> decision_ids,
        boolean include_factors
) {}
