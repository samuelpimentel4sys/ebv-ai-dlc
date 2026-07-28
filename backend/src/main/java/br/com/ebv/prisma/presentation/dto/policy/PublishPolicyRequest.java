package br.com.ebv.prisma.presentation.dto.policy;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;

public record PublishPolicyRequest(
        @NotBlank @JsonProperty("approval_id") String approvalId,
        @NotNull @JsonProperty("effective_at") Instant effectiveAt,
        @JsonProperty("release_note") String releaseNote,
        @NotBlank @JsonProperty("expected_draft_hash") String expectedDraftHash
) {}
