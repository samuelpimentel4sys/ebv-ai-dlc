package br.com.ebv.prisma.presentation.dto.utilitylink;

import jakarta.validation.constraints.NotBlank;

public record LinkUtilityRequest(
        @NotBlank String documento,
        @NotBlank String partnerCode,
        @NotBlank String accountRef,
        String utilityType,
        String holderName
) {}
