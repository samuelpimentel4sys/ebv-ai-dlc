package br.com.ebv.prisma.application.dossier;

import br.com.ebv.prisma.application.decision.SnapshotHash;
import br.com.ebv.prisma.domain.audit.port.in.AppendAuditEventUseCase;
import br.com.ebv.prisma.domain.counterfactual.port.out.CounterfactualRepositoryPort;
import br.com.ebv.prisma.domain.decision.exception.DecisionNotFoundException;
import br.com.ebv.prisma.domain.decision.port.out.DecisionRepositoryPort;
import br.com.ebv.prisma.domain.dossier.port.in.IssueDossierUseCase;
import br.com.ebv.prisma.domain.dossier.port.out.DossierRepositoryPort;
import br.com.ebv.prisma.domain.explain.port.out.ExplanationRepositoryPort;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
public class IssueDossierService implements IssueDossierUseCase {

    public static final String STATUS_ISSUED = "ISSUED";
    public static final String EVENT_DOSSIER_ISSUED = "DOSSIER_ISSUED";

    private final DecisionRepositoryPort decisionRepo;
    private final ExplanationRepositoryPort explanationRepo;
    private final CounterfactualRepositoryPort counterfactualRepo;
    private final DossierRepositoryPort dossierRepo;
    private final AppendAuditEventUseCase appendAuditEvent;
    private final ObjectMapper objectMapper;
    private final Path dossierBasePath;

    public IssueDossierService(
            DecisionRepositoryPort decisionRepo,
            ExplanationRepositoryPort explanationRepo,
            CounterfactualRepositoryPort counterfactualRepo,
            DossierRepositoryPort dossierRepo,
            AppendAuditEventUseCase appendAuditEvent,
            ObjectMapper objectMapper,
            @Value("${prisma.dossier.base-path:./data/dossier}") String dossierBasePath
    ) {
        this.decisionRepo = decisionRepo;
        this.explanationRepo = explanationRepo;
        this.counterfactualRepo = counterfactualRepo;
        this.dossierRepo = dossierRepo;
        this.appendAuditEvent = appendAuditEvent;
        this.objectMapper = objectMapper;
        this.dossierBasePath = Path.of(dossierBasePath);
    }

    @Override
    @Transactional
    public Result execute(Command command) {
        long start = System.nanoTime();
        if (command.decisionId() == null) {
            throw new IllegalArgumentException("decision_id obrigatório");
        }
        if (command.purpose() == null || command.purpose().isBlank()) {
            throw new IllegalArgumentException("purpose obrigatório");
        }
        if (command.legalBasis() == null || command.legalBasis().isBlank()) {
            throw new IllegalArgumentException("legal_basis obrigatório");
        }
        List<String> formats = normalizeFormats(command.formats());

        var decision = decisionRepo.findById(command.decisionId())
                .orElseThrow(() -> new DecisionNotFoundException(command.decisionId()));

        UUID dossierId = UUID.randomUUID();
        Instant now = Instant.now();

        Map<String, Object> artifact = new LinkedHashMap<>();
        artifact.put("dossier_id", dossierId.toString());
        artifact.put("decision_id", decision.decisionId().toString());
        artifact.put("documento", decision.documento());
        artifact.put("outcome", decision.outcome());
        artifact.put("score", decision.score());
        artifact.put("model_version", decision.modelVersion());
        artifact.put("snapshot_hash", decision.sha256());
        artifact.put("snapshot_ref", decision.storageUri());
        artifact.put("purpose", command.purpose());
        artifact.put("legal_basis", command.legalBasis());
        artifact.put("formats", formats);
        artifact.put("issued_at", now.toString());

        explanationRepo.findByDecisionId(decision.decisionId()).ifPresent(e -> {
            Map<String, Object> expl = new LinkedHashMap<>();
            expl.put("base_value", e.baseValue());
            expl.put("model_version", e.modelVersion());
            expl.put("factors_json", e.factorsJson());
            expl.put("created_at", e.createdAt().toString());
            artifact.put("explanation", expl);
        });

        counterfactualRepo.findByDecisionId(decision.decisionId()).ifPresent(c -> {
            Map<String, Object> cf = new LinkedHashMap<>();
            cf.put("actions_json", c.actionsJson());
            cf.put("created_at", c.createdAt().toString());
            artifact.put("counterfactual", cf);
        });

        String artifactJson;
        try {
            artifactJson = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(artifact);
        } catch (Exception e) {
            throw new IllegalStateException("Falha serialização dossiê JSON", e);
        }

        String manifestHash = "sha256:" + SnapshotHash.sha256Hex(artifactJson);
        String jsonUri = writeJsonArtifact(dossierId, artifactJson);
        String pdfUri = null;
        if (formats.contains("PDF")) {
            pdfUri = writePdfStub(dossierId, dossierId + " PDF stub — PDFBox real later\n" + manifestHash);
        }

        long durationMs = (System.nanoTime() - start) / 1_000_000L;

        dossierRepo.save(new DossierRepositoryPort.DossierRecord(
                dossierId,
                decision.decisionId(),
                command.purpose().trim(),
                command.legalBasis().trim(),
                STATUS_ISSUED,
                toFormatsJson(formats),
                artifactJson,
                pdfUri != null ? pdfUri : jsonUri,
                manifestHash,
                now
        ));

        Map<String, Object> auditPayload = new LinkedHashMap<>();
        auditPayload.put("dossierId", dossierId.toString());
        auditPayload.put("decisionId", decision.decisionId().toString());
        auditPayload.put("purpose", command.purpose());
        auditPayload.put("legalBasis", command.legalBasis());
        auditPayload.put("manifestHash", manifestHash);
        appendAuditEvent.execute(new AppendAuditEventUseCase.Command(
                decision.documento(),
                command.actorId() != null ? command.actorId() : "system",
                EVENT_DOSSIER_ISSUED,
                auditPayload
        ));

        return new Result(
                dossierId,
                decision.decisionId(),
                STATUS_ISSUED,
                "sha256:" + decision.sha256().substring(0, Math.min(12, decision.sha256().length())),
                manifestHash,
                formats,
                durationMs,
                now
        );
    }

    private String writeJsonArtifact(UUID id, String json) {
        try {
            Files.createDirectories(dossierBasePath);
            Path file = dossierBasePath.resolve(id + ".json");
            Files.writeString(file, json, StandardCharsets.UTF_8);
            return file.toAbsolutePath().normalize().toUri().toString();
        } catch (Exception e) {
            throw new IllegalStateException("Falha gravação artifact JSON dossiê: " + e.getMessage(), e);
        }
    }

    private String writePdfStub(UUID id, String text) {
        try {
            Files.createDirectories(dossierBasePath);
            Path file = dossierBasePath.resolve(id + ".pdf");
            // Minimal PDF header + plain text stub (PDFBox real later)
            String stub = "%PDF-1.4\n% Prisma dossier stub\n" + text + "\n%%EOF\n";
            Files.writeString(file, stub, StandardCharsets.UTF_8);
            return file.toAbsolutePath().normalize().toUri().toString();
        } catch (Exception e) {
            throw new IllegalStateException("Falha gravação PDF stub dossiê: " + e.getMessage(), e);
        }
    }

    private String toFormatsJson(List<String> formats) {
        try {
            return objectMapper.writeValueAsString(formats);
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    static List<String> normalizeFormats(List<String> formats) {
        if (formats == null || formats.isEmpty()) {
            return List.of("JSON");
        }
        return formats.stream()
                .map(f -> f.trim().toUpperCase(Locale.ROOT))
                .filter(f -> f.equals("PDF") || f.equals("JSON"))
                .distinct()
                .toList();
    }
}
