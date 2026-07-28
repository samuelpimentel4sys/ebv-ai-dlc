package br.com.ebv.prisma.infrastructure.adapter.worm;

import br.com.ebv.prisma.domain.decision.exception.WormWriteException;
import br.com.ebv.prisma.domain.decision.port.out.WormStoragePort;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.FileAlreadyExistsException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.Optional;
import java.util.UUID;

/**
 * Local filesystem WORM adapter — refuse overwrite simulates S3 Object Lock.
 */
@Component
public class LocalFilesystemWormAdapter implements WormStoragePort {

    private final Path basePath;
    private final boolean fail;

    public LocalFilesystemWormAdapter(
            @Value("${prisma.worm.base-path:./data/worm}") String basePath,
            @Value("${prisma.worm.fail:false}") boolean fail
    ) {
        this.basePath = Path.of(basePath);
        this.fail = fail;
    }

    @Override
    public String put(UUID decisionId, String canonicalJson) {
        if (fail) {
            throw new WormWriteException("WORM forçado a falhar (prisma.worm.fail=true)");
        }
        try {
            Files.createDirectories(basePath);
            Path file = basePath.resolve(decisionId + ".json");
            if (Files.exists(file)) {
                throw new WormWriteException("Object Lock: recusa overwrite de " + file);
            }
            Files.writeString(
                    file,
                    canonicalJson,
                    StandardCharsets.UTF_8,
                    StandardOpenOption.CREATE_NEW,
                    StandardOpenOption.WRITE
            );
            return file.toAbsolutePath().normalize().toUri().toString();
        } catch (FileAlreadyExistsException e) {
            throw new WormWriteException("Object Lock: recusa overwrite de " + decisionId, e);
        } catch (WormWriteException e) {
            throw e;
        } catch (IOException e) {
            throw new WormWriteException("Falha gravação WORM: " + e.getMessage(), e);
        }
    }

    @Override
    public Optional<String> get(UUID decisionId) {
        Path file = basePath.resolve(decisionId + ".json");
        if (!Files.exists(file)) {
            return Optional.empty();
        }
        try {
            return Optional.of(Files.readString(file, StandardCharsets.UTF_8));
        } catch (IOException e) {
            return Optional.empty();
        }
    }
}
