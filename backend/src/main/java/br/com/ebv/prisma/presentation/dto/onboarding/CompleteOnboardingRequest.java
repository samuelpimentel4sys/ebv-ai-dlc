package br.com.ebv.prisma.presentation.dto.onboarding;

import jakarta.validation.constraints.NotNull;

public record CompleteOnboardingRequest(
        @NotNull String contractVersion,
        @NotNull Boolean accepted,
        String billingEmail
) {}
