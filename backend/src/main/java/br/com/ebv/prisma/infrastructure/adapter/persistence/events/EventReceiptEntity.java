package br.com.ebv.prisma.infrastructure.adapter.persistence.events;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "tb_event_receipt")
public class EventReceiptEntity {

    @Id
    @Column(name = "event_id")
    private UUID eventId;

    @Column(nullable = false, length = 14)
    private String documento;

    @Column(name = "event_type", nullable = false, length = 80)
    private String eventType;

    @Column(nullable = false, length = 120)
    private String topic;

    @Column(name = "partition_id", nullable = false)
    private Integer partitionId;

    @Column(name = "offset_id", nullable = false)
    private Long offsetId;

    @Column(name = "schema_version", nullable = false, length = 40)
    private String schemaVersion;

    @Column(name = "idempotency_key")
    private UUID idempotencyKey;

    @Column(name = "received_at", nullable = false)
    private OffsetDateTime receivedAt;

    public UUID getEventId() { return eventId; }
    public void setEventId(UUID eventId) { this.eventId = eventId; }
    public String getDocumento() { return documento; }
    public void setDocumento(String documento) { this.documento = documento; }
    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }
    public String getTopic() { return topic; }
    public void setTopic(String topic) { this.topic = topic; }
    public Integer getPartitionId() { return partitionId; }
    public void setPartitionId(Integer partitionId) { this.partitionId = partitionId; }
    public Long getOffsetId() { return offsetId; }
    public void setOffsetId(Long offsetId) { this.offsetId = offsetId; }
    public String getSchemaVersion() { return schemaVersion; }
    public void setSchemaVersion(String schemaVersion) { this.schemaVersion = schemaVersion; }
    public UUID getIdempotencyKey() { return idempotencyKey; }
    public void setIdempotencyKey(UUID idempotencyKey) { this.idempotencyKey = idempotencyKey; }
    public OffsetDateTime getReceivedAt() { return receivedAt; }
    public void setReceivedAt(OffsetDateTime receivedAt) { this.receivedAt = receivedAt; }
}
