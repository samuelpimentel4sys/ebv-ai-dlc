package br.com.ebv.prisma.presentation.dto.audit;

import jakarta.validation.constraints.NotBlank;

import java.util.Map;

public record ExportAuditRequest(
        Map<String, Object> filters,
        String format,
        @NotBlank String purpose
) {}
