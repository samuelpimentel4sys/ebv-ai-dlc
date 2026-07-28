package br.com.ebv.prisma.presentation.dto.dispute;

import jakarta.validation.constraints.NotBlank;

public record OpenDisputeRequest(
        @NotBlank String documento,
        @NotBlank String reason_code,
        @NotBlank String description,
        String channel,
        String record_ref
) {}
