package br.com.ebv.prisma.presentation.dto.thinfile;

import jakarta.validation.constraints.NotBlank;

public record CalculateThinfileScoreRequest(
        @NotBlank String documento,
        Integer traditionalHistoryCount
) {}
