package br.com.ebv.prisma.presentation.dto.fairness;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

public record AnalyzeFairnessRequest(
        @NotBlank String model_version,
        @NotNull @Valid Window window,
        List<String> segments,
        List<String> metrics,
        String threshold_profile
) {
    public record Window(
            @NotNull LocalDate from,
            @NotNull LocalDate to
    ) {}
}
