package br.com.ebv.prisma.domain.decision.port.out;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DecisionRepositoryPort {

    record DecisionRecord(
            UUID decisionId,
            String documento,
            BigDecimal score,
            String modelVersion,
            String outcome,
            String sha256,
            String prevSha256,
            String storageUri,
            Instant createdAt,
            Integer latencyMs,
            List<String> degradedFlags,
            String clientId,
            boolean partial,
            String productCode,
            String explanationRef,
            LocalDate lockedUntil
    ) {}

    void save(DecisionRecord record);

    Optional<DecisionRecord> findById(UUID decisionId);

    Optional<DecisionRecord> findLatestByDocumento(String documento);

    Optional<DecisionRecord> findBySha256(String sha256);

    Optional<DecisionRecord> findPreviousByDocumento(String documento, Instant before);
}
