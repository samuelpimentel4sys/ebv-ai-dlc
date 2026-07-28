package br.com.ebv.prisma.infrastructure.adapter.persistence.policy;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "tb_policy_version")
public class PolicyVersionEntity {

    @Id
    private UUID id;

    @Column(nullable = false, length = 40)
    private String version;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "artifact_json", nullable = false, columnDefinition = "TEXT")
    private String artifactJson;

    @Column(name = "artifact_hash", length = 128)
    private String artifactHash;

    @Column(length = 120)
    private String author;

    @Column(name = "approval_id", length = 80)
    private String approvalId;

    @Column(name = "effective_at")
    private OffsetDateTime effectiveAt;

    @Column(name = "release_note", columnDefinition = "TEXT")
    private String releaseNote;

    @Column(name = "git_commit", length = 40)
    private String gitCommit;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "published_at")
    private OffsetDateTime publishedAt;

    @Column(nullable = false)
    private boolean immutable;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getVersion() { return version; }
    public void setVersion(String version) { this.version = version; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getArtifactJson() { return artifactJson; }
    public void setArtifactJson(String artifactJson) { this.artifactJson = artifactJson; }
    public String getArtifactHash() { return artifactHash; }
    public void setArtifactHash(String artifactHash) { this.artifactHash = artifactHash; }
    public String getAuthor() { return author; }
    public void setAuthor(String author) { this.author = author; }
    public String getApprovalId() { return approvalId; }
    public void setApprovalId(String approvalId) { this.approvalId = approvalId; }
    public OffsetDateTime getEffectiveAt() { return effectiveAt; }
    public void setEffectiveAt(OffsetDateTime effectiveAt) { this.effectiveAt = effectiveAt; }
    public String getReleaseNote() { return releaseNote; }
    public void setReleaseNote(String releaseNote) { this.releaseNote = releaseNote; }
    public String getGitCommit() { return gitCommit; }
    public void setGitCommit(String gitCommit) { this.gitCommit = gitCommit; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public OffsetDateTime getPublishedAt() { return publishedAt; }
    public void setPublishedAt(OffsetDateTime publishedAt) { this.publishedAt = publishedAt; }
    public boolean isImmutable() { return immutable; }
    public void setImmutable(boolean immutable) { this.immutable = immutable; }
}
