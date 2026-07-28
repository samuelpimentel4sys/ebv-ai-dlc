package br.com.ebv.prisma.presentation.dto.dispute;

import jakarta.validation.constraints.NotBlank;

public record OpenSelfServiceDisputeRequest(
        @NotBlank String sessionToken,
        @NotBlank String reason_code,
        @NotBlank String description,
        String record_ref
) {}
