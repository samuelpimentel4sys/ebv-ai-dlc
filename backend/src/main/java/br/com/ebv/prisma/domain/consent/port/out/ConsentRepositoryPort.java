package br.com.ebv.prisma.domain.consent.port.out;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ConsentRepositoryPort {

    record ConsentRecord(
            UUID consentId,
            String documentoHash,
            String purposeCode,
            String sourceCode,
            String status,
            Instant grantedAt,
            Instant revokedAt,
            Instant validTo,
            String channel,
            String versionTermo
    ) {}

    void save(ConsentRecord record);

    Optional<ConsentRecord> findById(UUID consentId);

    List<ConsentRecord> findByDocumentoHash(String documentoHash);
}
