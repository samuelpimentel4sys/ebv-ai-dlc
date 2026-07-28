package br.com.ebv.prisma.presentation.dto.identity;

import java.util.UUID;

public record IdentityResponse(
        UUID grId,
        int version,
        String canonicalDocumento,
        String status,
        int links
) {}
