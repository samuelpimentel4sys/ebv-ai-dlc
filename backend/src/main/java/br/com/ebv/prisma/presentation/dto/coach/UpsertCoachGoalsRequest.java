package br.com.ebv.prisma.presentation.dto.coach;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record UpsertCoachGoalsRequest(
        @NotBlank String documento,
        @NotEmpty List<Goal> goals
) {
    public record Goal(String goalType, String title, String estimateText, Boolean guaranteesApproval) {}
}
