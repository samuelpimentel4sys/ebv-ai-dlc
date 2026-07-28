package br.com.ebv.prisma.application.audit;

import br.com.ebv.prisma.application.decision.SnapshotHash;
import br.com.ebv.prisma.domain.audit.exception.AuditValidationException;
import br.com.ebv.prisma.domain.audit.port.in.ExportAuditTrailUseCase;
import br.com.ebv.prisma.domain.audit.port.out.AuditTrailRepositoryPort;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class ExportAuditTrailService implements ExportAuditTrailUseCase {

    static final String STATUS_PROCESSING = "PROCESSING";
    static final int RETENTION_YEARS = 7;
    private static final Set<String> FORMATS = Set.of("JSON", "CSV");

    private final AuditTrailRepositoryPort repo;
    private final ObjectMapper objectMapper;

    public ExportAuditTrailService(AuditTrailRepositoryPort repo, ObjectMapper objectMapper) {
        this.repo = repo;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional
    public Result execute(Command command) {
        if (command.purpose() == null || command.purpose().isBlank()) {
            throw new AuditValidationException("purpose obrigatório");
        }
        String format = command.format() == null ? "JSON" : command.format().trim().toUpperCase(Locale.ROOT);
        if (!FORMATS.contains(format)) {
            throw new AuditValidationException("format deve ser CSV|JSON");
        }

        UUID exportId = UUID.randomUUID();
        Instant now = Instant.now();
        LocalDate retentionUntil = LocalDate.ofInstant(now, ZoneOffset.UTC).plusYears(RETENTION_YEARS);

        Map<String, Object> filters = command.filters() == null ? Map.of() : command.filters();
        Map<String, Object> manifest = new LinkedHashMap<>();
        manifest.put("export_id", exportId.toString());
        manifest.put("format", format);
        manifest.put("purpose", command.purpose().trim());
        manifest.put("filters", filters);
        manifest.put("requested_at", now.toString());
        manifest.put("retention_until", retentionUntil.toString());

        String canonical = SnapshotHash.toCanonicalJson(objectMapper, manifest);
        String manifestHash = "sha256:" + SnapshotHash.sha256Hex(canonical);

        String filtersJson;
        try {
            filtersJson = objectMapper.writeValueAsString(filters);
        } catch (Exception e) {
            throw new IllegalStateException("Falha serialização filters", e);
        }

        repo.saveExport(new AuditTrailRepositoryPort.AuditExportRecord(
                exportId, STATUS_PROCESSING, format, command.purpose().trim(),
                manifestHash, retentionUntil, now, filtersJson
        ));

        return new Result(exportId, STATUS_PROCESSING, manifestHash, retentionUntil, now);
    }
}
