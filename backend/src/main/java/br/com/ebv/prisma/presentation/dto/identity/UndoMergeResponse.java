package br.com.ebv.prisma.presentation.dto.identity;

import java.util.UUID;

public record UndoMergeResponse(
        UUID restoredGrId,
        String restoredStatus,
        int restoredVersion,
        UUID survivorGrId,
        int survivorVersion,
        String kafkaTopic,
        Long kafkaOffset
) {}
