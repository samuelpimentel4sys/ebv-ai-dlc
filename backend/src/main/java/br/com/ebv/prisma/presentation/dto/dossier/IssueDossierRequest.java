package br.com.ebv.prisma.presentation.dto.dossier;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

public record IssueDossierRequest(
        @NotNull UUID decision_id,
        @NotBlank String purpose,
        @NotBlank String legal_basis,
        List<String> formats
) {}
