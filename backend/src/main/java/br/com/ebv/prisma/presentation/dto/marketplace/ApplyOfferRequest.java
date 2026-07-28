package br.com.ebv.prisma.presentation.dto.marketplace;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record ApplyOfferRequest(
        @NotBlank String documento,
        @NotNull UUID consentId
) {}
