package br.com.ebv.prisma.presentation.dto.policysim;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.Map;

public record SimulatePolicyRequest(
        @NotNull Map<String, Object> candidate_policy,
        @NotBlank String sample_ref,
        List<String> metrics
) {}
