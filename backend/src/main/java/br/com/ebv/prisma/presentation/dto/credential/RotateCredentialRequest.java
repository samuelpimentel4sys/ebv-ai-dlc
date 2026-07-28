package br.com.ebv.prisma.presentation.dto.credential;

public record RotateCredentialRequest(
        Boolean emergency,
        Integer overlapHours,
        String reason
) {}
