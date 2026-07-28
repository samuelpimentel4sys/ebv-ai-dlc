package br.com.ebv.prisma.presentation.controller;

import br.com.ebv.prisma.domain.sla.port.in.CreateSlaPolicyUseCase;
import br.com.ebv.prisma.domain.sla.port.in.GetSlaStatusUseCase;
import br.com.ebv.prisma.domain.sla.port.in.ListSlaEscalationsUseCase;
import br.com.ebv.prisma.presentation.dto.sla.CreateSlaPolicyRequest;
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
@RequestMapping("/api/v1/sla")
@Tag(name = "SLA", description = "PRISMA-EP-05-F06 Vigilância e escalonamento SLA")
public class SlaController {

    private final GetSlaStatusUseCase getStatus;
    private final CreateSlaPolicyUseCase createPolicy;
    private final ListSlaEscalationsUseCase listEscalations;

    public SlaController(
            GetSlaStatusUseCase getStatus,
            CreateSlaPolicyUseCase createPolicy,
            ListSlaEscalationsUseCase listEscalations
    ) {
        this.getStatus = getStatus;
        this.createPolicy = createPolicy;
        this.listEscalations = listEscalations;
    }

    @GetMapping("/status")
    @Operation(summary = "Agrega open disputes por risco SLA + scan escalations")
    public Map<String, Object> status(@RequestParam(required = false, defaultValue = "24h") String window) {
        var r = getStatus.execute(new GetSlaStatusUseCase.Query(window));
        Map<String, Object> counts = new LinkedHashMap<>();
        counts.put("onTrack", r.counts().onTrack());
        counts.put("atRisk", r.counts().atRisk());
        counts.put("overdue", r.counts().overdue());
        List<Map<String, Object>> sample = r.atRiskSample().stream().map(i -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("protocol", i.protocol());
            m.put("businessDaysRemaining", i.businessDaysRemaining());
            m.put("stage", i.stage());
            m.put("assignedTo", i.assignedTo());
            return m;
        }).toList();
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("asOf", r.asOf().toString());
        body.put("counts", counts);
        body.put("atRiskSample", sample);
        body.put("escalationsCreated", r.escalationsCreated());
        return body;
    }

    @PostMapping("/policies")
    @Operation(summary = "Cria política de escalonamento ACTIVE")
    public ResponseEntity<Map<String, Object>> createPolicy(@Valid @RequestBody CreateSlaPolicyRequest req) {
        var r = createPolicy.execute(new CreateSlaPolicyUseCase.Command(
                req.name(), req.escalateAtPct(), req.notifyChannels()
        ));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("id", r.id().toString());
        body.put("name", r.name());
        body.put("escalateAtPct", r.escalateAtPct());
        body.put("notifyChannels", r.notifyChannels());
        body.put("status", r.status());
        body.put("createdAt", r.createdAt().toString());
        return ResponseEntity.status(HttpStatus.CREATED).body(body);
    }

    @GetMapping("/escalations")
    @Operation(summary = "Lista histórico de escalonamentos")
    public Map<String, Object> escalations() {
        List<Map<String, Object>> items = listEscalations.execute().stream().map(e -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", e.id().toString());
            m.put("disputeId", e.disputeId().toString());
            m.put("level", e.level());
            m.put("notifiedAt", e.notifiedAt().toString());
            m.put("reason", e.reason());
            return m;
        }).toList();
        return Map.of("items", items);
    }
}
