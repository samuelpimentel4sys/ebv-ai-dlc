package br.com.ebv.prisma.presentation.controller;

import br.com.ebv.prisma.domain.ingest.port.in.IngestOpenFinanceUseCase;
import br.com.ebv.prisma.domain.ingest.port.in.ListIngestSourcesUseCase;
import br.com.ebv.prisma.domain.ingest.port.in.ReplayIngestUseCase;
import br.com.ebv.prisma.presentation.dto.ingest.OpenFinanceCallbackRequest;
import br.com.ebv.prisma.presentation.dto.ingest.OpenFinanceCallbackResponse;
import br.com.ebv.prisma.presentation.dto.ingest.ReplayIngestRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/ingest")
@Tag(name = "Ingest", description = "PRISMA-EP-01-F06 Ingestão multi-fonte")
public class IngestController {

    private final IngestOpenFinanceUseCase ingestOpenFinance;
    private final ListIngestSourcesUseCase listSources;
    private final ReplayIngestUseCase replayIngest;

    public IngestController(
            IngestOpenFinanceUseCase ingestOpenFinance,
            ListIngestSourcesUseCase listSources,
            ReplayIngestUseCase replayIngest
    ) {
        this.ingestOpenFinance = ingestOpenFinance;
        this.listSources = listSources;
        this.replayIngest = replayIngest;
    }

    @PostMapping("/openfinance/callback")
    @Operation(summary = "Callback Open Finance → normaliza e publica F01")
    public ResponseEntity<OpenFinanceCallbackResponse> openFinanceCallback(
            @Valid @RequestBody OpenFinanceCallbackRequest request,
            @RequestHeader(value = "X-Idempotency-Key", required = false) UUID idempotencyKey
    ) {
        var result = ingestOpenFinance.execute(new IngestOpenFinanceUseCase.CallbackCommand(
                request.consentId(),
                request.documento(),
                request.resources(),
                idempotencyKey
        ));
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(new OpenFinanceCallbackResponse(
                result.accepted(),
                result.eventsPublished(),
                result.deduplicated(),
                result.status()
        ));
    }

    @GetMapping("/sources")
    @Operation(summary = "Status dos conectores de ingestão (contrato FE)")
    public ListIngestSourcesUseCase.SourcesResponse sources() {
        return listSources.execute();
    }

    @PostMapping("/replay")
    @Operation(summary = "Replay isolado de janela (exige justification/approval)")
    public Map<String, Object> replay(@Valid @RequestBody ReplayIngestRequest request) {
        var result = replayIngest.execute(new ReplayIngestUseCase.ReplayCommand(
                request.sourceId(),
                request.windowStart(),
                request.windowEnd(),
                request.justification()
        ));
        return Map.of(
                "replayId", result.replayId().toString(),
                "status", result.status(),
                "eventsQueued", result.eventsQueued()
        );
    }
}
