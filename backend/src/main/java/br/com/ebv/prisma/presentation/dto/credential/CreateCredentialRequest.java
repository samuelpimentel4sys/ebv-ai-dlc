package br.com.ebv.prisma.presentation.dto.credential;

import java.util.List;

public record CreateCredentialRequest(
        String tenantId,
        List<String> scopes,
        String env,
        Integer rateLimit
) {}
