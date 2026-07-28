package br.com.ebv.prisma.application.dossier;

import br.com.ebv.prisma.domain.dossier.exception.DossierNotFoundException;
import br.com.ebv.prisma.domain.dossier.port.in.GetDossierUseCase;
import br.com.ebv.prisma.domain.dossier.port.out.DossierRepositoryPort;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class GetDossierService implements GetDossierUseCase {

    private final DossierRepositoryPort dossierRepo;
    private final ObjectMapper objectMapper;

    public GetDossierService(DossierRepositoryPort dossierRepo, ObjectMapper objectMapper) {
        this.dossierRepo = dossierRepo;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional(readOnly = true)
    public Result execute(UUID dossierId) {
        var d = dossierRepo.findById(dossierId)
                .orElseThrow(() -> new DossierNotFoundException(dossierId));
        List<String> formats = parseFormats(d.formatsJson());
        String snapshotHash = null;
        try {
            var tree = objectMapper.readTree(d.artifactJson());
            if (tree.has("snapshot_hash")) {
                String raw = tree.get("snapshot_hash").asText();
                snapshotHash = raw.startsWith("sha256:") ? raw : "sha256:" + raw.substring(0, Math.min(12, raw.length()));
            }
        } catch (Exception ignored) {
            // optional
        }
        return new Result(
                d.id(),
                d.decisionId(),
                d.status(),
                d.purpose(),
                d.legalBasis(),
                snapshotHash,
                d.manifestHash(),
                formats,
                d.createdAt()
        );
    }

    private List<String> parseFormats(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            return List.of("JSON");
        }
    }
}
