package br.com.ebv.prisma.infrastructure.adapter.persistence.credential;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "tb_api_credential")
public class ApiCredentialEntity {

    @Id
    private UUID id;

    @Column(name = "client_id", nullable = false, unique = true, length = 80)
    private String clientId;

    @Column(name = "secret_hash", nullable = false, length = 128)
    private String secretHash;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String scopes;

    @Column(nullable = false, length = 16)
    private String env;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "rate_limit", nullable = false)
    private int rateLimit;

    @Column(name = "tenant_id", nullable = false, length = 64)
    private String tenantId;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "rotated_at")
    private OffsetDateTime rotatedAt;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getClientId() { return clientId; }
    public void setClientId(String clientId) { this.clientId = clientId; }
    public String getSecretHash() { return secretHash; }
    public void setSecretHash(String secretHash) { this.secretHash = secretHash; }
    public String getScopes() { return scopes; }
    public void setScopes(String scopes) { this.scopes = scopes; }
    public String getEnv() { return env; }
    public void setEnv(String env) { this.env = env; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public int getRateLimit() { return rateLimit; }
    public void setRateLimit(int rateLimit) { this.rateLimit = rateLimit; }
    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public OffsetDateTime getRotatedAt() { return rotatedAt; }
    public void setRotatedAt(OffsetDateTime rotatedAt) { this.rotatedAt = rotatedAt; }
}
