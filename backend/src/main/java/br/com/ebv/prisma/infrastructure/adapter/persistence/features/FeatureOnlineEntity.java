package br.com.ebv.prisma.infrastructure.adapter.persistence.features;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;

import java.io.Serializable;
import java.time.OffsetDateTime;
import java.util.Objects;

@Entity
@Table(name = "tb_feature_online")
@IdClass(FeatureOnlineEntity.Pk.class)
public class FeatureOnlineEntity {

    @Id
    @Column(length = 14)
    private String documento;

    @Id
    @Column(name = "feature_name", length = 120)
    private String featureName;

    @Id
    @Column(name = "event_ts")
    private OffsetDateTime eventTs;

    @Column(name = "value_json", nullable = false, columnDefinition = "TEXT")
    private String valueJson;

    @Column(name = "written_at", nullable = false)
    private OffsetDateTime writtenAt;

    public String getDocumento() { return documento; }
    public void setDocumento(String documento) { this.documento = documento; }
    public String getFeatureName() { return featureName; }
    public void setFeatureName(String featureName) { this.featureName = featureName; }
    public OffsetDateTime getEventTs() { return eventTs; }
    public void setEventTs(OffsetDateTime eventTs) { this.eventTs = eventTs; }
    public String getValueJson() { return valueJson; }
    public void setValueJson(String valueJson) { this.valueJson = valueJson; }
    public OffsetDateTime getWrittenAt() { return writtenAt; }
    public void setWrittenAt(OffsetDateTime writtenAt) { this.writtenAt = writtenAt; }

    public static class Pk implements Serializable {
        private String documento;
        private String featureName;
        private OffsetDateTime eventTs;

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof Pk pk)) return false;
            return Objects.equals(documento, pk.documento)
                    && Objects.equals(featureName, pk.featureName)
                    && Objects.equals(eventTs, pk.eventTs);
        }

        @Override
        public int hashCode() {
            return Objects.hash(documento, featureName, eventTs);
        }
    }
}
