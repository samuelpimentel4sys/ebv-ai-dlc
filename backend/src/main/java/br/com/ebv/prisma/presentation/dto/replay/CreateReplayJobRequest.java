package br.com.ebv.prisma.presentation.dto.replay;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;

public record CreateReplayJobRequest(
        @NotNull Instant windowStart,
        @NotNull Instant windowEnd,
        @NotBlank String targetEnv,
        String approverId,
        String justification
) {}
