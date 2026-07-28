package br.com.ebv.prisma.application.altdata;

import br.com.ebv.prisma.domain.altdata.exception.AltDataValidationException;
import br.com.ebv.prisma.domain.altdata.port.in.IngestAltDataUseCase;
import br.com.ebv.prisma.domain.altdata.port.out.AltDataRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Service
public class IngestAltDataService implements IngestAltDataUseCase {

    private static final BigDecimal QUALITY_LIMIT = new BigDecimal("0.0500");
    private final AltDataRepositoryPort repo;

    public IngestAltDataService(AltDataRepositoryPort repo) { this.repo = repo; }

    @Override
    @Transactional
    public Result execute(Command command) {
        if (command.partnerCode() == null || command.partnerCode().isBlank()) {
            throw new AltDataValidationException("partnerCode obrigatório");
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
}
