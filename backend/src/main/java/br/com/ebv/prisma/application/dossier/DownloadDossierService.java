package br.com.ebv.prisma.application.dossier;

import br.com.ebv.prisma.domain.dossier.exception.DossierNotFoundException;
import br.com.ebv.prisma.domain.dossier.port.in.DownloadDossierUseCase;
import br.com.ebv.prisma.domain.dossier.port.out.DossierRepositoryPort;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;
import java.util.UUID;

@Service
public class DownloadDossierService implements DownloadDossierUseCase {

    private final DossierRepositoryPort dossierRepo;
    private final Path dossierBasePath;

    public DownloadDossierService(
            DossierRepositoryPort dossierRepo,
            @Value("${prisma.dossier.base-path:./data/dossier}") String dossierBasePath
    ) {
        this.dossierRepo = dossierRepo;
        this.dossierBasePath = Path.of(dossierBasePath);
    }

    @Override
    @Transactional(readOnly = true)
    public Result execute(UUID dossierId, String format) {
        if (format == null || format.isBlank()) {
            throw new IllegalArgumentException("format obrigatório (PDF|JSON)");
        }
        String fmt = format.trim().toUpperCase(Locale.ROOT);
        if (!fmt.equals("PDF") && !fmt.equals("JSON")) {
            throw new IllegalArgumentException("format deve ser PDF ou JSON");
        }

        var d = dossierRepo.findById(dossierId)
                .orElseThrow(() -> new DossierNotFoundException(dossierId));

        if (fmt.equals("JSON")) {
            byte[] body = d.artifactJson() != null
                    ? d.artifactJson().getBytes(StandardCharsets.UTF_8)
                    : readFile(dossierBasePath.resolve(dossierId + ".json"));
            return new Result("JSON", "application/json", body);
        }

        Path pdf = dossierBasePath.resolve(dossierId + ".pdf");
        if (Files.exists(pdf)) {
            return new Result("PDF", "application/pdf", readFile(pdf));
        }
        // Fallback stub bytes
        String stub = "%PDF-1.4\n% Prisma dossier stub for " + dossierId + "\n%%EOF\n";
        return new Result("PDF", "application/pdf", stub.getBytes(StandardCharsets.UTF_8));
    }

    private static byte[] readFile(Path path) {
        try {
            return Files.readAllBytes(path);
        } catch (Exception e) {
            throw new IllegalStateException("Falha leitura artefato dossiê: " + e.getMessage(), e);
        }
    }
}
