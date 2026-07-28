package br.com.ebv.prisma.presentation.dto.subjectrequest;

import jakarta.validation.constraints.NotBlank;

public record OpenSubjectRequestRequest(
        @NotBlank String right_type,
        @NotBlank String subject_token,
        @NotBlank String channel,
        @NotBlank String description
) {}
