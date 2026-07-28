package br.com.ebv.prisma.presentation.dto.reason;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record CreateReasonRequest(
        @NotBlank String code,
        @NotBlank @JsonProperty("consumer_text") String consumerText,
        @NotBlank @JsonProperty("analyst_text") String analystText,
        List<String> channels,
        List<MappingDto> mappings
) {
    public record MappingDto(
            @JsonProperty("attribute_code") String attributeCode,
            String direction,
            @JsonProperty("minimum_magnitude") Double minimumMagnitude
    ) {}
}
