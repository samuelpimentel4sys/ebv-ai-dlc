package br.com.ebv.prisma.domain.identity.model;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

/**
 * Aggregate root — Golden Record versionado (PRISMA-EP-01-F07).
 */
public final class GoldenRecord {

    private final GoldenRecordId id;
    private final DocumentoCanonico canonicalDocumento;
    private int version;
    private GoldenRecordStatus status;
    private final List<IdentityLink> links;

    public GoldenRecord(GoldenRecordId id, DocumentoCanonico canonicalDocumento, int version, GoldenRecordStatus status) {
        this.id = Objects.requireNonNull(id);
        this.canonicalDocumento = Objects.requireNonNull(canonicalDocumento);
        if (version < 1) {
            throw new IllegalArgumentException("version >= 1");
        }
        this.version = version;
        this.status = Objects.requireNonNull(status);
        this.links = new ArrayList<>();
    }

    public static GoldenRecord create(DocumentoCanonico documento) {
        return new GoldenRecord(GoldenRecordId.generate(), documento, 1, GoldenRecordStatus.ACTIVE);
    }

    public void addLink(IdentityLink link) {
        Objects.requireNonNull(link);
        links.add(link);
    }

    /** RN003 — nova versão a cada merge survivor. */
    public void bumpVersionAfterMerge() {
        ensureActive();
        this.version = this.version + 1;
    }

    public void markMerged() {
        ensureActive();
        this.status = GoldenRecordStatus.MERGED;
    }

    public void restoreActive() {
        if (status != GoldenRecordStatus.MERGED) {
            throw new IllegalStateException("Somente MERGED pode ser restaurado");
        }
        this.status = GoldenRecordStatus.ACTIVE;
        this.version = this.version + 1;
    }

    private void ensureActive() {
        if (status != GoldenRecordStatus.ACTIVE) {
            throw new IllegalStateException("Golden record não está ACTIVE: " + status);
        }
    }

    public GoldenRecordId getId() {
        return id;
    }

    public DocumentoCanonico getCanonicalDocumento() {
        return canonicalDocumento;
    }

    public int getVersion() {
        return version;
    }

    public GoldenRecordStatus getStatus() {
        return status;
    }

    public List<IdentityLink> getLinks() {
        return Collections.unmodifiableList(links);
    }

    public int linkCount() {
        return links.size();
    }

    public record IdentityLink(GoldenRecordId grId, String sourceSystem, String sourceKey, BigDecimal confidence) {
        public IdentityLink {
            Objects.requireNonNull(grId);
            Objects.requireNonNull(sourceSystem);
            Objects.requireNonNull(sourceKey);
            Objects.requireNonNull(confidence);
            if (sourceSystem.isBlank() || sourceKey.isBlank()) {
                throw new IllegalArgumentException("sourceSystem/sourceKey obrigatórios");
            }
            if (confidence.compareTo(BigDecimal.ZERO) < 0 || confidence.compareTo(BigDecimal.ONE) > 0) {
                throw new IllegalArgumentException("confidence deve estar em [0,1]");
            }
        }
    }
}
