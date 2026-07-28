package br.com.ebv.prisma.infrastructure.adapter.persistence.identity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "tb_identity_merge_trail")
public class IdentityMergeTrailEntity {

    @Id
    private UUID id;

    @Column(nullable = false, length = 20)
    private String action;

    @Column(name = "from_gr")
    private UUID fromGr;

    @Column(name = "to_gr")
    private UUID toGr;

    @Column(nullable = false)
    private UUID actor;

    @Column(nullable = false)
    private OffsetDateTime at;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public UUID getFromGr() { return fromGr; }
    public void setFromGr(UUID fromGr) { this.fromGr = fromGr; }
    public UUID getToGr() { return toGr; }
    public void setToGr(UUID toGr) { this.toGr = toGr; }
    public UUID getActor() { return actor; }
    public void setActor(UUID actor) { this.actor = actor; }
    public OffsetDateTime getAt() { return at; }
    public void setAt(OffsetDateTime at) { this.at = at; }
}
