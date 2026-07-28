package br.com.ebv.prisma.presentation.dto.dispute;

import jakarta.validation.constraints.NotBlank;

public record ResolveDisputeRequest(
        @NotBlank String outcome,
        @NotBlank String rationale
) {}
