package br.com.ebv.prisma.presentation.dto.onboarding;

import jakarta.validation.constraints.NotBlank;

public record StartOnboardingRequest(
        @NotBlank String cnpj,
        @NotBlank String legalName,
        @NotBlank String representative
) {}
