package br.com.ebv.prisma.application.dispute;

import br.com.ebv.prisma.domain.dispute.exception.DisputeConflictException;
import br.com.ebv.prisma.domain.dispute.exception.DisputeNotFoundException;
import br.com.ebv.prisma.domain.dispute.exception.DisputeValidationException;
import br.com.ebv.prisma.domain.dispute.port.in.ResolveDisputeUseCase;
import br.com.ebv.prisma.domain.dispute.port.out.DisputeRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Locale;
import java.util.Set;

@Service
public class ResolveDisputeService implements ResolveDisputeUseCase {

    private static final Set<String> RESOLVABLE = Set.of("OPEN", "IN_DILIGENCE");

    private final DisputeRepositoryPort repo;

    public ResolveDisputeService(DisputeRepositoryPort repo) {
        this.repo = repo;
    }

    @Override
    @Transactional
    public Result execute(Command command) {
        if (command.rationale() == null || command.rationale().isBlank()) {
            throw new DisputeValidationException("rationale obrigatório");
        }
        if (command.outcome() == null || command.outcome().isBlank()) {
            throw new DisputeValidationException("outcome obrigatório");
        }

        var existing = repo.findById(command.id())
                .orElseThrow(() -> new DisputeNotFoundException("Dispute não encontrada: " + command.id()));

        if (!RESOLVABLE.contains(existing.status())) {
            throw new DisputeConflictException("Dispute já resolvida ou cancelada: " + existing.status());
        }

        String outcome = command.outcome().trim().toUpperCase(Locale.ROOT);
        String status = mapStatus(outcome);
        Instant now = Instant.now();

        repo.save(new DisputeRepositoryPort.DisputeRecord(
                existing.id(), existing.protocol(), existing.documento(), status,
                existing.reasonCode(), existing.description(), existing.channel(),
                existing.dueAt(), now, outcome, command.rationale().trim(), existing.createdAt()
        ));
        repo.appendTimeline(existing.id(), "RESOLVED", "Desfecho: " + outcome, "ANALISTA", now);

        return new Result(existing.id(), existing.protocol(), status, outcome, now);
    }

    private static String mapStatus(String outcome) {
        return switch (outcome) {
            case "FAVOR_TITULAR", "PROCEDENTE", "RESOLVED_FAVOR_TITULAR" -> "RESOLVED_FAVOR_TITULAR";
            case "MAINTAIN", "IMPROCEDENTE", "RESOLVED_MAINTAIN" -> "RESOLVED_MAINTAIN";
            default -> throw new DisputeValidationException(
                    "outcome inválido: use FAVOR_TITULAR|PROCEDENTE|MAINTAIN|IMPROCEDENTE");
        };
    }
}
