package br.com.ebv.prisma.domain.reason.port.out;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ReasonVersionRepositoryPort {

    record ReasonVersionRecord(
            UUID id,
            String code,
            int version,
            String status,
            String consumerText,
            String analystText,
            String channelsJson,
            String mappingsJson,
            String legalApproval,
            Instant createdAt
    ) {}

    record PageResult(List<ReasonVersionRecord> items, int page, int size, long totalElements, int totalPages) {}

    void save(ReasonVersionRecord record);

    Optional<ReasonVersionRecord> findById(UUID id);

    Optional<Integer> findMaxVersion(String code);

    PageResult search(String status, String channel, int page, int size);

    List<ReasonVersionRecord> findApprovedForChannel(String channel);
}
