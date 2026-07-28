package br.com.ebv.prisma.presentation.dto.scoring;

import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record RollbackModelRequest(
        @NotBlank String toVersion,
        List<String> approverIds
) {}
