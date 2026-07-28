package br.com.ebv.prisma.application.pj;

import br.com.ebv.prisma.domain.pj.exception.PjConflictException;
import br.com.ebv.prisma.domain.pj.exception.PjNotFoundException;
import br.com.ebv.prisma.domain.pj.exception.PjValidationException;
import br.com.ebv.prisma.domain.pj.port.in.SubmitPjOpinionUseCase;
import br.com.ebv.prisma.domain.pj.port.out.PjHitlRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Set;
import java.util.UUID;

@Service
public class SubmitPjOpinionService implements SubmitPjOpinionUseCase {

    private static final Set<String> SUBMITTABLE = Set.of("READY_FOR_REVIEW");

    private final PjHitlRepositoryPort repo;

    public SubmitPjOpinionService(PjHitlRepositoryPort repo) {
        this.repo = repo;
    }

    @Override
    @Transactional
    public Result execute(Command command) {
        if (command.opinionId() == null) {
            throw new PjValidationException("opinionId obrigatório");
        }
        if (command.actorId() == null) {
            throw new PjValidationException("actorId obrigatório");
        }

        var opinion = repo.findOpinion(command.opinionId())
                .orElseThrow(() -> new PjNotFoundException("Parecer não encontrado: " + command.opinionId()));

        if (!SUBMITTABLE.contains(opinion.status())) {
            throw new PjConflictException("status " + opinion.status() + " não permite submit (exige READY_FOR_REVIEW)");
        }

        var guardrail = repo.latestGuardrailStatus(opinion.id());
        if (guardrail.isPresent() && "FAILED".equalsIgnoreCase(guardrail.get())) {
            throw new PjConflictException("guardrail FAILED — submit bloqueado");
        }

        BigDecimal amount = opinion.operationAmount() == null ? BigDecimal.ZERO : opinion.operationAmount();
        var policy = repo.findPolicyForAmount(amount)
                .orElseThrow(() -> new PjConflictException("nenhuma política de alçada para amount=" + amount));

        UUID trailId = UUID.randomUUID();
        Instant at = Instant.now();
        repo.appendTrail(new PjHitlRepositoryPort.TrailRecord(
                trailId, opinion.id(), "SUBMIT", command.actorId(),
                policy.levelCode(), command.comment(), at
        ));
        repo.updateOpinionStatus(opinion.id(), "SUBMITTED");

        return new Result(opinion.id(), "SUBMITTED", policy.levelCode(), trailId);
    }
}
