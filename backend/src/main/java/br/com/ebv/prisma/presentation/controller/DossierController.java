package br.com.ebv.prisma.presentation.controller;

import br.com.ebv.prisma.domain.dossier.port.in.DownloadDossierUseCase;
import br.com.ebv.prisma.domain.dossier.port.in.GetDossierUseCase;
import br.com.ebv.prisma.domain.dossier.port.in.IssueDossierUseCase;
import br.com.ebv.prisma.presentation.dto.dossier.IssueDossierRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/dossier")
@Tag(name = "Dossier", description = "PRISMA-EP-02-F03 Dossiê regulatório (PDFBox stub)")
public class DossierController {

    private final IssueDossierUseCase issueDossier;
    private final GetDossierUseCase getDossier;
    private final DownloadDossierUseCase downloadDossier;

    public DossierController(
            IssueDossierUseCase issueDossier,
            GetDossierUseCase getDossier,
            DownloadDossierUseCase downloadDossier
    ) {
        this.issueDossier = issueDossier;
        this.getDossier = getDossier;
        this.downloadDossier = downloadDossier;
    }

    @PostMapping
    @Operation(summary = "Emite dossiê regulatório")
    public ResponseEntity<Map<String, Object>> issue(@Valid @RequestBody IssueDossierRequest req) {
        var r = issueDossier.execute(new IssueDossierUseCase.Command(
                req.decision_id(), req.purpose(), req.legal_basis(), req.formats(), "api"
        ));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("dossier_id", r.dossierId().toString());
        body.put("decision_id", r.decisionId().toString());
        body.put("status", r.status());
        body.put("snapshot_hash", r.snapshotHash());
        body.put("document_hash", r.documentHash());
        body.put("formats", r.formats());
        body.put("duration_ms", r.durationMs());
        body.put("issued_at", r.issuedAt().toString());
        return ResponseEntity.status(HttpStatus.CREATED).body(body);
    }

    @GetMapping("/{dossierId}")
    @Operation(summary = "Consulta metadados do dossiê")
    public Map<String, Object> get(@PathVariable UUID dossierId) {
        var r = getDossier.execute(dossierId);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("dossier_id", r.dossierId().toString());
        body.put("decision_id", r.decisionId().toString());
        body.put("status", r.status());
        body.put("purpose", r.purpose());
        body.put("legal_basis", r.legalBasis());
        body.put("snapshot_hash", r.snapshotHash());
        body.put("document_hash", r.documentHash());
        body.put("formats", r.formats());
        body.put("issued_at", r.issuedAt().toString());
        return body;
    }

    @GetMapping("/{dossierId}/download")
    @Operation(summary = "Baixa artefato PDF ou JSON")
    public ResponseEntity<byte[]> download(
            @PathVariable UUID dossierId,
            @RequestParam String format
    ) {
        var r = downloadDossier.execute(dossierId, format);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(r.contentType()));
        headers.set(HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename=\"dossier-" + dossierId + "." + r.format().toLowerCase() + "\"");
        return ResponseEntity.ok().headers(headers).body(r.body());
    }
}
