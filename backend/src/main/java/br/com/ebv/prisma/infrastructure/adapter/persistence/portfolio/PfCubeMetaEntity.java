package br.com.ebv.prisma.infrastructure.adapter.persistence.portfolio;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

@Entity
@Table(name = "tb_pf_cube_meta")
public class PfCubeMetaEntity {
    @Id @Column(name = "cube_name", length = 80) private String cubeName;
    @Column(name = "last_refresh_at") private OffsetDateTime lastRefreshAt;
    @Column(name = "freshness_sla_minutes", nullable = false) private int freshnessSlaMinutes;
    @Column(nullable = false, length = 20) private String status;
    public String getCubeName() { return cubeName; }
    public void setCubeName(String v) { cubeName = v; }
    public OffsetDateTime getLastRefreshAt() { return lastRefreshAt; }
    public void setLastRefreshAt(OffsetDateTime v) { lastRefreshAt = v; }
    public int getFreshnessSlaMinutes() { return freshnessSlaMinutes; }
    public void setFreshnessSlaMinutes(int v) { freshnessSlaMinutes = v; }
    public String getStatus() { return status; }
    public void setStatus(String v) { status = v; }
}
