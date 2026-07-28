package br.com.ebv.prisma.infrastructure.adapter.persistence.portfolio;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "tb_pf_timeline_event")
public class PfTimelineEventEntity {
    @Id @Column(name = "event_id") private UUID eventId;
    @Column(name = "portfolio_id", nullable = false) private UUID portfolioId;
    @Column(name = "event_at", nullable = false) private OffsetDateTime eventAt;
    @Column(name = "event_type", nullable = false, length = 40) private String eventType;
    @Column(name = "impact_json") private String impactJson;
    @Column(nullable = false, length = 255) private String label;
    public UUID getEventId() { return eventId; }
    public void setEventId(UUID v) { eventId = v; }
    public UUID getPortfolioId() { return portfolioId; }
    public void setPortfolioId(UUID v) { portfolioId = v; }
    public OffsetDateTime getEventAt() { return eventAt; }
    public void setEventAt(OffsetDateTime v) { eventAt = v; }
    public String getEventType() { return eventType; }
    public void setEventType(String v) { eventType = v; }
    public String getImpactJson() { return impactJson; }
    public void setImpactJson(String v) { impactJson = v; }
    public String getLabel() { return label; }
    public void setLabel(String v) { label = v; }
}
