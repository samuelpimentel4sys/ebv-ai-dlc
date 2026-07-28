package br.com.ebv.prisma.application.altdata;

import br.com.ebv.prisma.domain.altdata.exception.AltDataValidationException;
import br.com.ebv.prisma.domain.altdata.port.in.IngestAltDataUseCase;
import br.com.ebv.prisma.domain.altdata.port.out.AltDataRepositoryPort;
import br.com.ebv.prisma.domain.consent.port.out.ConsentRepositoryPort;
import br.com.ebv.prisma.domain.ingest.exception.ConsentDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Set;
import java.util.UUID;

/** OBS-19 — ingest fail-closed sem consentimento ACTIVE de dados alternativos. */
@Service
public class IngestAltDataService implements IngestAltDataUseCase {

    private static final BigDecimal QUALITY_LIMIT = new BigDecimal("0.0500");
    private static final Set<String> ALT_PURPOSES = Set.of(
            "ALTERNATIVE_DATA", "UTILITIES", "ALT_DATA", "UTILITY_SCORE"
    );

    private final AltDataRepositoryPort repo;
    private final ConsentRepositoryPort consents;

    public IngestAltDataService(AltDataRepositoryPort repo, ConsentRepositoryPort consents) {
        this.repo = repo;
        this.consents = consents;
    }

    @Override
    @Transactional
    public Result execute(Command command) {
        if (command.partnerCode() == null || command.partnerCode().isBlank()) {
            throw new AltDataValidationException("partnerCode obrigatório");
        }
        if (command.documento() == null || command.documento().isBlank()) {
            throw new AltDataValidationException("documento obrigatório (consent gate)");
        }

        String hash = sha256(command.documento().replaceAll("\\D", ""));
        boolean allowed = consents.findByDocumentoHash(hash).stream()
                .anyMatch(c -> "ACTIVE".equals(c.status()) && ALT_PURPOSES.contains(c.purposeCode()));
        if (!allowed) {
            throw new ConsentDeniedException(
                    "consentimento ACTIVE ausente para ALTERNATIVE_DATA/UTILITIES (OBS-19 fail-closed)"
            );
        }

        BigDecimal err = command.errorRate() != null ? command.errorRate() : BigDecimal.ZERO;
        String status = err.compareTo(QUALITY_LIMIT) > 0 ? "REJECTED" : "ACCEPTED";
        UUID id = UUID.randomUUID();
        UUID corr = UUID.randomUUID();
        repo.save(new AltDataRepositoryPort.BatchRecord(
                id, command.partnerCode(),
                command.utilityType() != null ? command.utilityType() : "ENERGIA",
                command.sourceUri() != null ? command.sourceUri() : "lab://stub",
                Instant.now(), Math.max(command.recordCount(), 0), err, QUALITY_LIMIT,
                status, status.equals("REJECTED") ? "error_rate_above_limit" : null, corr
        ));
        return new Result(id, status, err, corr);
    }

    static String sha256(String value) {
        try {
            byte[] dig = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(dig);
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
