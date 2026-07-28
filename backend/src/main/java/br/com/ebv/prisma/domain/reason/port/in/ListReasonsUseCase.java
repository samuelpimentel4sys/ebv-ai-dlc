package br.com.ebv.prisma.domain.reason.port.in;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface ListReasonsUseCase {

    record Query(String status, String channel, int page, int size) {}

    record Item(
            UUID id,
            String code,
            int version,
            String status,
            String consumerText,
            String analystText,
            List<String> channels,
            String legalApproval,
            Instant createdAt
    ) {}

    record Page(List<Item> items, int page, int size, long totalElements, int totalPages) {}

    Page execute(Query query);
}
