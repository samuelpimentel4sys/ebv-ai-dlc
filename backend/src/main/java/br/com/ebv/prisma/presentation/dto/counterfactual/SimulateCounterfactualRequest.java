package br.com.ebv.prisma.presentation.dto.counterfactual;

import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

public record SimulateCounterfactualRequest(
        @NotNull UUID decision_id,
        List<Change> changes,
        String target_band
) {
    public record Change(String attribute_code, Object proposed_value) {}
}
