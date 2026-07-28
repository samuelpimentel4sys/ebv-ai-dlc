package br.com.ebv.prisma.infrastructure.adapter.worm;

import br.com.ebv.prisma.domain.audit.exception.AuditWormWriteException;
import br.com.ebv.prisma.domain.audit.port.out.AuditWormStoragePort;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.FileAlreadyExistsException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.UUID;

/** Lab FS WORM for audit trail — refuse overwrite like decision WORM. Default backend=fs. */
@Component
@ConditionalOnProperty(name = "prisma.audit-worm.backend", havingValue = "fs", matchIfMissing = true)
public class LocalFilesystemAuditWormAdapter implements AuditWormStoragePort {

    private final Path basePath;
    private final boolean fail;

    public LocalFilesystemAuditWormAdapter(
            @Value("${prisma.audit-worm.base-path:./data/audit-worm}") String basePath,
            @Value("${prisma.audit-worm.fail:false}") boolean fail
    ) {
        this.basePath = Path.of(basePath);
        this.fail = fail;
    }

    @Override
    public String put(UUID eventId, String canonicalJson) {
        if (fail) {
            throw new AuditWormWriteException("Audit WORM forçado a falhar (prisma.audit-worm.fail=true)");
        }
        try {
            Files.createDirectories(basePath);
            Path file = basePath.resolve(eventId + ".json");
            if (Files.exists(file)) {
                throw new AuditWormWriteException("Object Lock: recusa overwrite de " + file);
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
            throw new AuditWormWriteException("Object Lock: recusa overwrite de " + eventId, e);
        } catch (AuditWormWriteException e) {
            throw e;
        } catch (IOException e) {
            throw new AuditWormWriteException("Falha gravação audit WORM: " + e.getMessage(), e);
        }
    }
}
