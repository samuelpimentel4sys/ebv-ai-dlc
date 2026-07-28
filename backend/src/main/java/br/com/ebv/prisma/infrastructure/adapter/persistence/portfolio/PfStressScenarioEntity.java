package br.com.ebv.prisma.infrastructure.adapter.persistence.portfolio;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "tb_pf_stress_scenario")
public class PfStressScenarioEntity {
    @Id @Column(name = "scenario_id") private UUID scenarioId;
    @Column(nullable = false, length = 40, unique = true) private String code;
    @Column(nullable = false, length = 20) private String kind;
    @Column(nullable = false, length = 120) private String label;
    @Column(name = "variables_json", nullable = false) private String variablesJson;
    public UUID getScenarioId() { return scenarioId; }
    public void setScenarioId(UUID v) { scenarioId = v; }
    public String getCode() { return code; }
    public void setCode(String v) { code = v; }
    public String getKind() { return kind; }
    public void setKind(String v) { kind = v; }
    public String getLabel() { return label; }
    public void setLabel(String v) { label = v; }
    public String getVariablesJson() { return variablesJson; }
    public void setVariablesJson(String v) { variablesJson = v; }
}
