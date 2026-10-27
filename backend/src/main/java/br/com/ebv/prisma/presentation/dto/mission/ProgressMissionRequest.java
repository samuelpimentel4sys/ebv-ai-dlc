package br.com.ebv.prisma.presentation.dto.mission;

import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;

/**
 * Contrato FE (inclusion.ts): verifiedEventId aceita UUID ou id lab "evt-{epoch}".
 */
public record ProgressMissionRequest(
        @NotBlank String documento,
        String verifiedEventType,
        String verifiedEventId,
        BigDecimal deltaPct
) {}
