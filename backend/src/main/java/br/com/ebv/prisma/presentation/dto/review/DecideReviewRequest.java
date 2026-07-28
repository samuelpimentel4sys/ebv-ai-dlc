package br.com.ebv.prisma.presentation.dto.review;

import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record DecideReviewRequest(
        @NotBlank String outcome,
        @NotBlank String rationale,
        List<String> reviewed_factors
) {}
