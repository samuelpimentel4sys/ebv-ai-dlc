package br.com.ebv.prisma.infrastructure.adapter.persistence.portfolio;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "tb_pf_stress_run")
public class PfStressRunEntity {
    @Id @Column(name = "run_id", length = 40) private String runId;
    @Column(name = "portfolio_id", nullable = false) private UUID portfolioId;
    @Column(name = "scenario_id") private UUID scenarioId;
    @Column(nullable = false, length = 20) private String status;
    @Column(name = "variables_json") private String variablesJson;
    @Column(name = "result_json") private String resultJson;
    @Column(name = "aggregate_version", length = 80) private String aggregateVersion;
    @Column(name = "created_at", nullable = false) private OffsetDateTime createdAt;
    @Column(name = "finished_at") private OffsetDateTime finishedAt;
    public String getRunId() { return runId; }
    public void setRunId(String v) { runId = v; }
    public UUID getPortfolioId() { return portfolioId; }
    public void setPortfolioId(UUID v) { portfolioId = v; }
    public UUID getScenarioId() { return scenarioId; }
    public void setScenarioId(UUID v) { scenarioId = v; }
    public String getStatus() { return status; }
    public void setStatus(String v) { status = v; }
    public String getVariablesJson() { return variablesJson; }
    public void setVariablesJson(String v) { variablesJson = v; }
    public String getResultJson() { return resultJson; }
    public void setResultJson(String v) { resultJson = v; }
    public String getAggregateVersion() { return aggregateVersion; }
    public void setAggregateVersion(String v) { aggregateVersion = v; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime v) { createdAt = v; }
    public OffsetDateTime getFinishedAt() { return finishedAt; }
    public void setFinishedAt(OffsetDateTime v) { finishedAt = v; }
}
