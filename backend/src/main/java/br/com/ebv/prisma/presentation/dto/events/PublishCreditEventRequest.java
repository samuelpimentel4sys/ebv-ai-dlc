package br.com.ebv.prisma.presentation.dto.events;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.util.Map;

public record PublishCreditEventRequest(
        @NotBlank String eventType,
        @NotBlank String documento,
        @NotNull Instant occurredAt,
        Map<String, Object> payload
) {}
