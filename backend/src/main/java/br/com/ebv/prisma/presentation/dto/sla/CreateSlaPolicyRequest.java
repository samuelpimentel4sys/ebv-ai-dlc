package br.com.ebv.prisma.presentation.dto.sla;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record CreateSlaPolicyRequest(
        @NotBlank String name,
        @NotNull @Min(1) @Max(100) Integer escalateAtPct,
        List<String> notifyChannels
) {}
