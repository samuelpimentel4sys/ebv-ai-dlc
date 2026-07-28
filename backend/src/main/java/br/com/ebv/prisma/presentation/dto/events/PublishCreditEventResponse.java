package br.com.ebv.prisma.presentation.dto.events;

import java.util.UUID;

public record PublishCreditEventResponse(
        UUID eventId,
        String topic,
        int partition,
        long offset,
        String schemaVersion,
        String status
) {}
