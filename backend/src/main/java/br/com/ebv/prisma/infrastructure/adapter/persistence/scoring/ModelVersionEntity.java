package br.com.ebv.prisma.infrastructure.adapter.persistence.scoring;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;

import java.io.Serializable;
import java.time.OffsetDateTime;
import java.util.Objects;

@Entity
@Table(name = "tb_model_version")
@IdClass(ModelVersionEntity.Pk.class)
public class ModelVersionEntity {

    @Id
    @Column(name = "model_id", length = 80)
    private String modelId;

    @Id
    @Column(length = 40)
    private String version;

    @Column(length = 20, nullable = false)
    private String stage;

    @Column(name = "artifact_uri", nullable = false, columnDefinition = "TEXT")
    private String artifactUri;

    @Column(name = "metrics_json", columnDefinition = "TEXT")
    private String metricsJson;

    @Column(nullable = false)
    private boolean immutable;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    public String getModelId() { return modelId; }
    public void setModelId(String modelId) { this.modelId = modelId; }
    public String getVersion() { return version; }
    public void setVersion(String version) { this.version = version; }
    public String getStage() { return stage; }
    public void setStage(String stage) { this.stage = stage; }
    public String getArtifactUri() { return artifactUri; }
    public void setArtifactUri(String artifactUri) { this.artifactUri = artifactUri; }
    public String getMetricsJson() { return metricsJson; }
    public void setMetricsJson(String metricsJson) { this.metricsJson = metricsJson; }
    public boolean isImmutable() { return immutable; }
    public void setImmutable(boolean immutable) { this.immutable = immutable; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public static class Pk implements Serializable {
        private String modelId;
        private String version;

        public Pk() {}
        public Pk(String modelId, String version) { this.modelId = modelId; this.version = version; }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof Pk pk)) return false;
            return Objects.equals(modelId, pk.modelId) && Objects.equals(version, pk.version);
        }

        @Override
        public int hashCode() { return Objects.hash(modelId, version); }

        public String getModelId() { return modelId; }
        public void setModelId(String modelId) { this.modelId = modelId; }
        public String getVersion() { return version; }
        public void setVersion(String version) { this.version = version; }
    }
}
