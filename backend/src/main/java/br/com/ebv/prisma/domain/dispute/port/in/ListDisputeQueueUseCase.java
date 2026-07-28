package br.com.ebv.prisma.domain.dispute.port.in;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface ListDisputeQueueUseCase {

    record Query(int page, int size) {}

    record Item(UUID id, String protocol, String documento, String status, Instant dueAt, Instant createdAt) {}

    record Result(List<Item> items, int page, int size, long totalElements, int totalPages) {}

    Result execute(Query query);
}
