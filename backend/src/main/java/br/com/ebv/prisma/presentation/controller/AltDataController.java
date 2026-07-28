package br.com.ebv.prisma.presentation.controller;

import br.com.ebv.prisma.domain.altdata.port.in.GetAltCoverageUseCase;
import br.com.ebv.prisma.domain.altdata.port.in.GetAltQualityUseCase;
import br.com.ebv.prisma.domain.altdata.port.in.IngestAltDataUseCase;
import br.com.ebv.prisma.presentation.dto.altdata.IngestAltDataRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/alternative-data")
@Tag(name = "Alternative Data", description = "PRISMA-EP-06-F01 Ingestão consentida (OBS-19 fail-closed)")
public class AltDataController {

    private final IngestAltDataUseCase ingest;
    private final GetAltCoverageUseCase coverage;
    private final GetAltQualityUseCase quality;

    public AltDataController(IngestAltDataUseCase ingest, GetAltCoverageUseCase coverage, GetAltQualityUseCase quality) {
        this.ingest = ingest;
        this.coverage = coverage;
        this.quality = quality;
    }

    @PostMapping("/ingest")
    @Operation(summary = "Recebe lote de utilities")
    public ResponseEntity<Map<String, Object>> ingest(@Valid @RequestBody IngestAltDataRequest req) {
        var r = ingest.execute(new IngestAltDataUseCase.Command(
                req.documento(), req.partnerCode(), req.utilityType(), req.sourceUri(),
                req.recordCount() != null ? req.recordCount() : 0,
                req.errorRate() != null ? req.errorRate() : BigDecimal.ZERO
        ));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("batchId", r.batchId().toString());
        body.put("status", r.status());
        body.put("errorRate", r.errorRate());
        body.put("correlationId", r.correlationId().toString());
        body.put("consentGate", "ACTIVE");
        body.put("lab", true);
        return ResponseEntity.status(HttpStatus.CREATED).body(body);
    }

    @GetMapping("/coverage")
    @Operation(summary = "Cobertura populacional")
    public Map<String, Object> coverage() {
        var r = coverage.execute();
        List<Map<String, Object>> items = r.coverage().stream().map(c -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("partnerCode", c.partnerCode());
            m.put("region", c.region());
            m.put("coveredTitulares", c.coveredTitulares());
            return m;
        }).toList();
        return Map.of("coverage", items);
    }

    @GetMapping("/quality")
    @Operation(summary = "Qualidade dos últimos lotes")
    public Map<String, Object> quality() {
        var r = quality.execute();
        List<Map<String, Object>> items = r.batches().stream().map(b -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("batchId", b.batchId().toString());
            m.put("partnerCode", b.partnerCode());
            m.put("status", b.status());
            m.put("errorRate", b.errorRate());
            return m;
        }).toList();
        return Map.of("batches", items);
    }
}
