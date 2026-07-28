package br.com.ebv.prisma.infrastructure.adapter.persistence.features;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "tb_feature_catalog")
public class FeatureCatalogEntity {

    @Id
    @Column(length = 120)
    private String name;

    @Column(nullable = false, length = 40)
    private String entity;

    @Column(name = "value_type", nullable = false, length = 40)
    private String valueType;

    @Column(name = "max_age_seconds", nullable = false)
    private int maxAgeSeconds;

    @Column(nullable = false, length = 80)
    private String owner;

    @Column(nullable = false)
    private boolean active;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEntity() { return entity; }
    public void setEntity(String entity) { this.entity = entity; }
    public String getValueType() { return valueType; }
    public void setValueType(String valueType) { this.valueType = valueType; }
    public int getMaxAgeSeconds() { return maxAgeSeconds; }
    public void setMaxAgeSeconds(int maxAgeSeconds) { this.maxAgeSeconds = maxAgeSeconds; }
    public String getOwner() { return owner; }
    public void setOwner(String owner) { this.owner = owner; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}
