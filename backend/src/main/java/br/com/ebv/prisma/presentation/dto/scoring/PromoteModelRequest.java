package br.com.ebv.prisma.presentation.dto.scoring;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record PromoteModelRequest(
        @NotBlank String version,
        @NotBlank String toStage,
        boolean canaryMetricsOk,
        List<String> approverIds,
        Boolean emergency
) {}
