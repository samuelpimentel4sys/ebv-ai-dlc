package br.com.ebv.prisma.infrastructure.adapter.persistence.portfolio;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

@Entity
@Table(name = "tb_pf_cube_job")
public class PfCubeJobEntity {
    @Id @Column(name = "job_id", length = 40) private String jobId;
    @Column(name = "cube_name", nullable = false, length = 80) private String cubeName;
    @Column(nullable = false, length = 20) private String mode;
    @Column(nullable = false, length = 20) private String status;
    @Column(name = "partitions_json") private String partitionsJson;
    @Column(name = "created_at", nullable = false) private OffsetDateTime createdAt;
    @Column(name = "finished_at") private OffsetDateTime finishedAt;
    public String getJobId() { return jobId; }
    public void setJobId(String v) { jobId = v; }
    public String getCubeName() { return cubeName; }
    public void setCubeName(String v) { cubeName = v; }
    public String getMode() { return mode; }
    public void setMode(String v) { mode = v; }
    public String getStatus() { return status; }
    public void setStatus(String v) { status = v; }
    public String getPartitionsJson() { return partitionsJson; }
    public void setPartitionsJson(String v) { partitionsJson = v; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime v) { createdAt = v; }
    public OffsetDateTime getFinishedAt() { return finishedAt; }
    public void setFinishedAt(OffsetDateTime v) { finishedAt = v; }
}
