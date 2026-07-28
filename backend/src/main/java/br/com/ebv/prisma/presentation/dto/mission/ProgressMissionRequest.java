package br.com.ebv.prisma.presentation.dto.mission;

import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;
import java.util.UUID;

public record ProgressMissionRequest(
        @NotBlank String documento,
        String verifiedEventType,
        UUID verifiedEventId,
        BigDecimal deltaPct
) {}
