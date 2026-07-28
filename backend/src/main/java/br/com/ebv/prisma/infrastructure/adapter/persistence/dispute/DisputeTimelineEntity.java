package br.com.ebv.prisma.infrastructure.adapter.persistence.dispute;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "tb_dispute_timeline")
public class DisputeTimelineEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "dispute_id", nullable = false)
    private UUID disputeId;

    @Column(name = "event_type", nullable = false, length = 60)
    private String eventType;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Column(length = 80)
    private String actor;

    @Column(name = "at", nullable = false)
    private OffsetDateTime at;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public UUID getDisputeId() { return disputeId; }
    public void setDisputeId(UUID disputeId) { this.disputeId = disputeId; }
    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getActor() { return actor; }
    public void setActor(String actor) { this.actor = actor; }
    public OffsetDateTime getAt() { return at; }
    public void setAt(OffsetDateTime at) { this.at = at; }
}
