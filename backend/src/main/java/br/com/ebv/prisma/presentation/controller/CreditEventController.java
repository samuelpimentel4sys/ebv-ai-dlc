package br.com.ebv.prisma.presentation.controller;

import br.com.ebv.prisma.domain.events.model.CreditEventType;
import br.com.ebv.prisma.domain.events.port.in.GetCreditEventUseCase;
import br.com.ebv.prisma.domain.events.port.in.PublishCreditEventUseCase;
import br.com.ebv.prisma.presentation.dto.events.PublishCreditEventRequest;
import br.com.ebv.prisma.presentation.dto.events.PublishCreditEventResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@Tag(name = "Credit Events", description = "PRISMA-EP-01-F01 Barramento de eventos")
public class CreditEventController {

    private final PublishCreditEventUseCase publishCreditEventUseCase;
    private final GetCreditEventUseCase getCreditEventUseCase;

    public CreditEventController(
            PublishCreditEventUseCase publishCreditEventUseCase,
            GetCreditEventUseCase getCreditEventUseCase
    ) {
        this.publishCreditEventUseCase = publishCreditEventUseCase;
        this.getCreditEventUseCase = getCreditEventUseCase;
    }

    @PostMapping("/events/credit")
    @Operation(summary = "Publica evento de crédito (particionado por documento)")
    public ResponseEntity<PublishCreditEventResponse> publish(
            @Valid @RequestBody PublishCreditEventRequest request,
            @RequestHeader(value = "X-Idempotency-Key", required = false) UUID idempotencyKey
    ) {
        var result = publishCreditEventUseCase.execute(new PublishCreditEventUseCase.PublishCommand(
                CreditEventType.parse(request.eventType()),
                request.documento(),
                request.occurredAt(),
                request.payload(),
                idempotencyKey
        ));
        HttpStatus status = "DUPLICATE".equals(result.status()) ? HttpStatus.OK : HttpStatus.ACCEPTED;
        return ResponseEntity.status(status).body(new PublishCreditEventResponse(
                result.eventId(),
                result.topic(),
                result.partition(),
                result.offset(),
                result.schemaVersion(),
                result.status()
        ));
    }

    @GetMapping("/events/{eventId}")
    @Operation(summary = "Consulta metadados do evento")
    public ResponseEntity<GetCreditEventUseCase.EventView> get(@PathVariable UUID eventId) {
        return getCreditEventUseCase.execute(eventId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/streams/health")
    @Operation(summary = "Saúde do barramento")
    public Map<String, Object> streamsHealth(
            @org.springframework.beans.factory.annotation.Value("${spring.profiles.active:}") String profiles
    ) {
        boolean infra = profiles.contains("infra");
        return Map.of(
                "status", "UP",
                "mode", infra ? "KAFKA" : "LOCAL_STUB",
                "topic", "prisma.credit.events",
                "bootstrapConfigured", infra
        );
    }
}
