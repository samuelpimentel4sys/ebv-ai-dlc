package br.com.ebv.prisma.infrastructure.adapter.persistence.liveness;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "tb_liveness_session")
public class LivenessSessionEntity {

    @Id
    private UUID id;

    @Column(name = "session_id", nullable = false, length = 100)
    private String sessionId;

    @Column(name = "customer_id", nullable = false)
    private UUID customerId;

    @Column(nullable = false, length = 30)
    private String status;

    @Column(name = "liveness_score")
    private BigDecimal livenessScore;

    @Column(name = "far_rate")
    private BigDecimal farRate;

    @Column(name = "device_id", length = 100)
    private String deviceId;

    @Column(nullable = false, length = 30)
    private String channel;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "app_version", length = 20)
    private String appVersion;

    @Column(length = 30)
    private String platform;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }
    public UUID getCustomerId() { return customerId; }
    public void setCustomerId(UUID customerId) { this.customerId = customerId; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public BigDecimal getLivenessScore() { return livenessScore; }
    public void setLivenessScore(BigDecimal livenessScore) { this.livenessScore = livenessScore; }
    public BigDecimal getFarRate() { return farRate; }
    public void setFarRate(BigDecimal farRate) { this.farRate = farRate; }
    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }
    public String getChannel() { return channel; }
    public void setChannel(String channel) { this.channel = channel; }
    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }
    public String getAppVersion() { return appVersion; }
    public void setAppVersion(String appVersion) { this.appVersion = appVersion; }
    public String getPlatform() { return platform; }
    public void setPlatform(String platform) { this.platform = platform; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }
}
