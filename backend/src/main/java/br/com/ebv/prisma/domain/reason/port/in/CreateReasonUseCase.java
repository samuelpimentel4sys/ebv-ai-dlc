package br.com.ebv.prisma.domain.reason.port.in;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface CreateReasonUseCase {

    record Mapping(String attributeCode, String direction, Double minimumMagnitude) {}

    record Command(
            String code,
            String consumerText,
            String analystText,
            List<String> channels,
            List<Mapping> mappings
    ) {}

    record Result(
            UUID reasonVersionId,
            String code,
            int version,
            String status,
            String legalApproval,
            Instant createdAt
    ) {}

    Result execute(Command command);
}
