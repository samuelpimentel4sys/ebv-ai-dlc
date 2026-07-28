package br.com.ebv.prisma.presentation.dto.subjectrequest;

import jakarta.validation.constraints.NotBlank;

import java.util.UUID;

public record PatchSubjectRequestRequest(
        @NotBlank String action,
        String response_summary,
        UUID attachment_id
) {}
