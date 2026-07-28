package br.com.ebv.prisma.presentation.dto.ingest;

public record OpenFinanceCallbackResponse(
        boolean accepted,
        int eventsPublished,
        int deduplicated,
        String status
) {}
