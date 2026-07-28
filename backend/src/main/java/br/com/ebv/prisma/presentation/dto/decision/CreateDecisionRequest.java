package br.com.ebv.prisma.presentation.dto.decision;

import jakarta.validation.constraints.NotBlank;

public record CreateDecisionRequest(
        @NotBlank String documento,
        String productCode,
        Boolean includeExplanation
) {
    public boolean includeExplanationOrDefault() {
        return Boolean.TRUE.equals(includeExplanation);
    }
}
