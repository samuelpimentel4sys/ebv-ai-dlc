package br.com.ebv.prisma.domain.utilitylink.port.out;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UtilityLinkRepositoryPort {
    record LinkRecord(
            UUID linkId, String documentoHash, String partnerCode, String accountRef,
            String utilityType, String status, Instant linkedAt, Instant unlinkedAt
    ) {}

    void save(LinkRecord record);
    Optional<LinkRecord> findById(UUID linkId);
    List<LinkRecord> findByDocumentoHash(String documentoHash);
}
