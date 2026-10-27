package br.com.ebv.prisma.infrastructure.adapter.worm;

import br.com.ebv.prisma.domain.dispute.exception.DisputeConflictException;
import br.com.ebv.prisma.domain.dispute.port.out.DisputeEvidenceStorePort;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.FileAlreadyExistsException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.UUID;

/**
 * Lab WORM store for dispute evidence — ./data/dispute-evidence/{disputeId}/{attachmentId}
 */
@Component
public class LocalDisputeEvidenceStoreAdapter implements DisputeEvidenceStorePort {

    private final Path basePath;

    public LocalDisputeEvidenceStoreAdapter(
            @Value("${prisma.dispute-evidence.base-path:./data/dispute-evidence}") String basePath
    ) {
        this.basePath = Path.of(basePath);
    }

    @Override
    public String store(UUID disputeId, UUID attachmentId, byte[] content) {
        try {
            Path root = basePath.toAbsolutePath().normalize();
            Path dir = root.resolve(disputeId.toString()).normalize();
            if (!dir.startsWith(root)) {
                throw new SecurityException("path fora do WORM root");
            }
            Files.createDirectories(dir);
            Path file = dir.resolve(attachmentId.toString()).normalize();
            if (!file.startsWith(root)) {
                throw new SecurityException("path fora do WORM root");
            }
            if (Files.exists(file)) {
                throw new DisputeConflictException("WORM: recusa overwrite de " + file);
            }
            Files.write(file, content, StandardOpenOption.CREATE_NEW, StandardOpenOption.WRITE);
            return file.toAbsolutePath().normalize().toUri().toString();
        } catch (FileAlreadyExistsException e) {
            throw new DisputeConflictException("WORM: recusa overwrite de " + attachmentId);
        } catch (DisputeConflictException | SecurityException e) {
            throw e;
        } catch (IOException e) {
            throw new IllegalStateException("Falha gravação evidência: " + e.getMessage(), e);
        }
    }

    @Override
    public byte[] read(String storageUri) {
        try {
            Path target = Path.of(java.net.URI.create(storageUri)).toAbsolutePath().normalize();
            Path root = basePath.toAbsolutePath().normalize();
            if (!target.startsWith(root)) {
                throw new SecurityException("storageUri fora do WORM root");
            }
            return Files.readAllBytes(target);
        } catch (SecurityException e) {
            throw e;
        } catch (IOException e) {
            throw new IllegalStateException("Falha leitura evidência: " + e.getMessage(), e);
        }
    }
}
