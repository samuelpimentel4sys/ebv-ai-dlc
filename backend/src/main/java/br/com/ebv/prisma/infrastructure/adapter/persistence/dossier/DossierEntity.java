package br.com.ebv.prisma.infrastructure.adapter.persistence.dossier;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "tb_dossier")
public class DossierEntity {

    @Id
    private UUID id;

    @Column(name = "decision_id", nullable = false)
    private UUID decisionId;

    @Column(nullable = false, length = 64)
    private String purpose;

    @Column(name = "legal_basis", nullable = false, length = 64)
    private String legalBasis;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String formats;

    @Column(name = "artifact_json", columnDefinition = "TEXT")
    private String artifactJson;

    @Column(name = "artifact_pdf_uri", columnDefinition = "TEXT")
    private String artifactPdfUri;

    @Column(name = "manifest_hash", length = 80)
    private String manifestHash;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getDecisionId() { return decisionId; }
    public void setDecisionId(UUID decisionId) { this.decisionId = decisionId; }
    public String getPurpose() { return purpose; }
    public void setPurpose(String purpose) { this.purpose = purpose; }
    public String getLegalBasis() { return legalBasis; }
    public void setLegalBasis(String legalBasis) { this.legalBasis = legalBasis; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getFormats() { return formats; }
    public void setFormats(String formats) { this.formats = formats; }
    public String getArtifactJson() { return artifactJson; }
    public void setArtifactJson(String artifactJson) { this.artifactJson = artifactJson; }
    public String getArtifactPdfUri() { return artifactPdfUri; }
    public void setArtifactPdfUri(String artifactPdfUri) { this.artifactPdfUri = artifactPdfUri; }
    public String getManifestHash() { return manifestHash; }
    public void setManifestHash(String manifestHash) { this.manifestHash = manifestHash; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
