package br.com.ebv.prisma.presentation.dto.review;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record OpenReviewRequest(
        @NotNull UUID decision_id,
        @NotBlank String subject_token,
        @NotBlank String reason,
        @NotBlank String channel
) {}
