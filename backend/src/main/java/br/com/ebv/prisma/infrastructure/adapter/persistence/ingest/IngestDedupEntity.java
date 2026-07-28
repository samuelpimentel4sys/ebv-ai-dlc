package br.com.ebv.prisma.infrastructure.adapter.persistence.ingest;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;

import java.io.Serializable;
import java.time.OffsetDateTime;
import java.util.Objects;

@Entity
@Table(name = "tb_ingest_dedup")
@IdClass(IngestDedupEntity.Pk.class)
public class IngestDedupEntity {

    @Id
    @Column(length = 40)
    private String source;

    @Id
    @Column(name = "natural_key", length = 200)
    private String naturalKey;

    @Id
    @Column(name = "event_ts")
    private OffsetDateTime eventTs;

    @Column(name = "payload_hash", nullable = false, length = 64)
    private String payloadHash;

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
    public String getNaturalKey() { return naturalKey; }
    public void setNaturalKey(String naturalKey) { this.naturalKey = naturalKey; }
    public OffsetDateTime getEventTs() { return eventTs; }
    public void setEventTs(OffsetDateTime eventTs) { this.eventTs = eventTs; }
    public String getPayloadHash() { return payloadHash; }
    public void setPayloadHash(String payloadHash) { this.payloadHash = payloadHash; }

    public static class Pk implements Serializable {
        private String source;
        private String naturalKey;
        private OffsetDateTime eventTs;

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof Pk pk)) return false;
            return Objects.equals(source, pk.source)
                    && Objects.equals(naturalKey, pk.naturalKey)
                    && Objects.equals(eventTs, pk.eventTs);
        }

        @Override
        public int hashCode() {
            return Objects.hash(source, naturalKey, eventTs);
        }
    }
}
