package br.com.ebv.prisma.infrastructure.adapter.persistence.coach;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "tb_coach_goal")
public class CoachGoalEntity {
    @Id @Column(name = "goal_id") private UUID goalId;
    @Column(name = "journey_id", nullable = false) private UUID journeyId;
    @Column(name = "goal_type", nullable = false) private String goalType;
    @Column(nullable = false) private String title;
    @Column(name = "estimate_text", nullable = false) private String estimateText;
    @Column(name = "guarantees_approval", nullable = false) private Boolean guaranteesApproval;
    @Column(nullable = false) private String status;
    @Column(name = "created_at", nullable = false) private OffsetDateTime createdAt;

    public UUID getGoalId() { return goalId; }
    public void setGoalId(UUID goalId) { this.goalId = goalId; }
    public UUID getJourneyId() { return journeyId; }
    public void setJourneyId(UUID journeyId) { this.journeyId = journeyId; }
    public String getGoalType() { return goalType; }
    public void setGoalType(String goalType) { this.goalType = goalType; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getEstimateText() { return estimateText; }
    public void setEstimateText(String estimateText) { this.estimateText = estimateText; }
    public Boolean getGuaranteesApproval() { return guaranteesApproval; }
    public void setGuaranteesApproval(Boolean guaranteesApproval) { this.guaranteesApproval = guaranteesApproval; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
