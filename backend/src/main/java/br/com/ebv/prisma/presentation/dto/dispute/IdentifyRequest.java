package br.com.ebv.prisma.presentation.dto.dispute;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;

public record IdentifyRequest(
        @NotBlank String documento,
        LocalDate birthDate,
        String lastDigits
) {}
