package br.com.ebv.prisma.presentation.dto.identity;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record UndoMergeRequest(
        @NotNull UUID survivorGrId,
        @NotNull UUID mergedGrId,
        UUID actorId
) {}
