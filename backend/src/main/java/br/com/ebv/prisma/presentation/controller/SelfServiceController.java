package br.com.ebv.prisma.presentation.controller;

import br.com.ebv.prisma.domain.dispute.port.in.IdentifySelfServiceUseCase;
import br.com.ebv.prisma.domain.dispute.port.in.ListSelfServiceRecordsUseCase;
import br.com.ebv.prisma.domain.dispute.port.in.OpenSelfServiceDisputeUseCase;
import br.com.ebv.prisma.presentation.dto.dispute.IdentifyRequest;
import br.com.ebv.prisma.presentation.dto.dispute.OpenSelfServiceDisputeRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/self-service")
@Tag(name = "SelfService", description = "PRISMA-EP-05-F05 Autoatendimento titular")
public class SelfServiceController {

    private final IdentifySelfServiceUseCase identify;
    private final ListSelfServiceRecordsUseCase listRecords;
    private final OpenSelfServiceDisputeUseCase openDispute;

    public SelfServiceController(
            IdentifySelfServiceUseCase identify,
            ListSelfServiceRecordsUseCase listRecords,
            OpenSelfServiceDisputeUseCase openDispute
    ) {
        this.identify = identify;
        this.listRecords = listRecords;
        this.openDispute = openDispute;
    }

    @PostMapping("/identify")
    @Operation(summary = "Verifica identidade e emite sessionToken")
    public Map<String, Object> identify(@Valid @RequestBody IdentifyRequest req) {
        var r = identify.execute(new IdentifySelfServiceUseCase.Command(
                req.documento(), req.birthDate(), req.lastDigits()
        ));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("sessionToken", r.sessionToken());
        body.put("verified", r.verified());
        body.put("expiresAt", r.expiresAt().toString());
        return body;
    }

    @GetMapping("/records")
    @Operation(summary = "Lista apontamentos stub do titular")
    public Map<String, Object> records(@RequestParam String sessionToken) {
        List<Map<String, Object>> items = listRecords.execute(
                new ListSelfServiceRecordsUseCase.Query(sessionToken)
        ).stream().map(i -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("recordRef", i.recordRef());
            m.put("type", i.type());
            m.put("creditor", i.creditor());
            m.put("amount", i.amount());
            m.put("status", i.status());
            return m;
        }).toList();
        return Map.of("items", items);
    }

    @PostMapping("/disputes")
    @Operation(summary = "Abre contestação via F02")
    public ResponseEntity<Map<String, Object>> openDispute(@Valid @RequestBody OpenSelfServiceDisputeRequest req) {
        var r = openDispute.execute(new OpenSelfServiceDisputeUseCase.Command(
                req.sessionToken(), req.reason_code(), req.description(), req.record_ref()
        ));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("id", r.id().toString());
        body.put("protocol", r.protocol());
        body.put("status", r.status());
        body.put("dueAt", r.dueAt().toString());
        body.put("trackingUrl", r.trackingUrl());
        return ResponseEntity.status(HttpStatus.CREATED).body(body);
    }
}
