package br.com.ebv.prisma.presentation.dto.scoring;

import jakarta.validation.constraints.NotBlank;

public record RecalculateScoreRequest(
        @NotBlank String documento,
        String reason,
        boolean critical
) {}
