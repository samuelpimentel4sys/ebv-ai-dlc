package br.com.ebv.prisma.presentation.dto.consent;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.time.Instant;
import java.util.List;

public record RegisterConsentRequest(
        @NotBlank String documento,
        @NotEmpty List<Item> items,
        String channel,
        String versionTermo
) {
    public record Item(String purposeCode, String sourceCode, Boolean accepted, Instant validTo) {}
}
