package br.com.ebv.prisma.presentation.dto.coach;

import jakarta.validation.constraints.NotBlank;

import java.util.UUID;

public record SimulateCoachActionRequest(
        @NotBlank String documento,
        @NotBlank String actionCode,
        UUID snapshotScoreId
) {}
