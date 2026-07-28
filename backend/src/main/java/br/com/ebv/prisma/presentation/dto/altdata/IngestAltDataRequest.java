package br.com.ebv.prisma.presentation.dto.altdata;

import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;

public record IngestAltDataRequest(
        @NotBlank String documento,
        @NotBlank String partnerCode,
        String utilityType,
        String sourceUri,
        Integer recordCount,
        BigDecimal errorRate
) {}
