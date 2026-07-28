package br.com.ebv.prisma.presentation.dto.identity;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record MergeIdentityRequest(
        @NotNull UUID survivorGrId,
        @NotNull UUID mergedGrId,
        @NotNull @DecimalMin("0.0") @DecimalMax("1.0") BigDecimal confidence,
        @NotBlank String reason,
        UUID actorId
) {}
