package br.com.ebv.prisma.presentation.dto.ingest;

import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record OpenFinanceCallbackRequest(
        @NotBlank String consentId,
        @NotBlank String documento,
        List<String> resources
) {}
