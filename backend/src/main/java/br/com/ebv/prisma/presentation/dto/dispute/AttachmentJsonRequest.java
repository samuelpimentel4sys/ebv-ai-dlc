package br.com.ebv.prisma.presentation.dto.dispute;

import jakarta.validation.constraints.NotBlank;

public record AttachmentJsonRequest(
        @NotBlank String filename,
        @NotBlank String contentBase64,
        @NotBlank String contentType,
        String prevAttachmentId
) {}
