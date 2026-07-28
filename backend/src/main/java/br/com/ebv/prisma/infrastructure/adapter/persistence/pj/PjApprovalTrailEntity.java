package br.com.ebv.prisma.infrastructure.adapter.persistence.pj;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "tb_pj_approval_trail")
public class PjApprovalTrailEntity {

    @Id
    private UUID id;

    @Column(name = "opinion_id", nullable = false)
    private UUID opinionId;

    @Column(nullable = false, length = 30)
    private String action;

    @Column(name = "actor_id", nullable = false)
    private UUID actorId;

    @Column(name = "level_code", length = 40)
    private String levelCode;

    @Column(columnDefinition = "TEXT")
    private String comment;

    @Column(nullable = false)
    private Instant at;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getOpinionId() { return opinionId; }
    public void setOpinionId(UUID opinionId) { this.opinionId = opinionId; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public UUID getActorId() { return actorId; }
    public void setActorId(UUID actorId) { this.actorId = actorId; }
    public String getLevelCode() { return levelCode; }
    public void setLevelCode(String levelCode) { this.levelCode = levelCode; }
    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }
    public Instant getAt() { return at; }
    public void setAt(Instant at) { this.at = at; }
}
