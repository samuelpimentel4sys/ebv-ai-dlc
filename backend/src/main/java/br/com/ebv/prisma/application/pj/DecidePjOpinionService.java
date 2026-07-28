package br.com.ebv.prisma.application.pj;

import br.com.ebv.prisma.domain.pj.exception.PjConflictException;
import br.com.ebv.prisma.domain.pj.exception.PjForbiddenException;
import br.com.ebv.prisma.domain.pj.exception.PjNotFoundException;
import br.com.ebv.prisma.domain.pj.exception.PjValidationException;
import br.com.ebv.prisma.domain.pj.port.in.DecidePjOpinionUseCase;
import br.com.ebv.prisma.domain.pj.port.out.PjHitlRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Comparator;
import java.util.Locale;
import java.util.UUID;

@Service
public class DecidePjOpinionService implements DecidePjOpinionUseCase {

    private final PjHitlRepositoryPort repo;

    public DecidePjOpinionService(PjHitlRepositoryPort repo) {
        this.repo = repo;
    }

    @Override
    @Transactional
    public Result execute(Command command) {
        if (command.opinionId() == null || command.actorId() == null) {
            throw new PjValidationException("opinionId e actorId obrigatórios");
        }
        String decision = command.decision() == null ? "" : command.decision().trim().toUpperCase(Locale.ROOT);
        if (!isValidDecision(decision)) {
            throw new PjValidationException("decision deve ser APPROVE | REJECT | ESCALATE");
        }

        var opinion = repo.findOpinion(command.opinionId())
                .orElseThrow(() -> new PjNotFoundException("Parecer não encontrado: " + command.opinionId()));

        if (!"SUBMITTED".equals(opinion.status())) {
            throw new PjConflictException("status " + opinion.status() + " não permite decisão HITL");
        }

        if (opinion.createdBy().equals(command.actorId())) {
            throw new PjForbiddenException("RN003: criador não pode aprovar o próprio parecer");
        }

        if ("REJECT".equals(decision) && (command.comment() == null || command.comment().isBlank())) {
            throw new PjValidationException("comment obrigatório em REJECT");
        }

        String requiredLevel = repo.listTrail(opinion.id()).stream()
                .filter(t -> "SUBMIT".equals(t.action()) || "ESCALATE".equals(t.action()))
                .max(Comparator.comparing(PjHitlRepositoryPort.TrailRecord::at))
                .map(PjHitlRepositoryPort.TrailRecord::levelCode)
                .orElse("L1");

        int requiredRank = levelRank(requiredLevel);
        int actorRank = levelRank(command.actorMaxLevel() == null ? "L1" : command.actorMaxLevel());

        Instant at = Instant.now();
        UUID trailId = UUID.randomUUID();
        String newStatus = opinion.status();
        String trailAction = decision;
        String levelCode = requiredLevel;

        if ("APPROVE".equals(decision)) {
            if (actorRank < requiredRank) {
                // CA-03: L1 insuficiente → escalate automático
                trailAction = "ESCALATE";
                levelCode = nextLevel(requiredLevel);
                repo.appendTrail(new PjHitlRepositoryPort.TrailRecord(
                        trailId, opinion.id(), trailAction, command.actorId(),
                        levelCode, "Alçada insuficiente (" + command.actorMaxLevel() + ") → escalate " + levelCode,
                        at
                ));
                return new Result(opinion.id(), "SUBMITTED", levelCode, at, trailId);
            }
            newStatus = "APPROVED";
        } else if ("REJECT".equals(decision)) {
            newStatus = "REJECTED";
        } else {
            // ESCALATE explícito
            levelCode = nextLevel(requiredLevel);
            newStatus = "SUBMITTED";
        }

        repo.appendTrail(new PjHitlRepositoryPort.TrailRecord(
                trailId, opinion.id(), trailAction, command.actorId(),
                levelCode, command.comment(), at
        ));
        if (!newStatus.equals(opinion.status())) {
            repo.updateOpinionStatus(opinion.id(), newStatus);
        }

        return new Result(opinion.id(), newStatus, levelCode, at, trailId);
    }

    private static boolean isValidDecision(String d) {
        return "APPROVE".equals(d) || "REJECT".equals(d) || "ESCALATE".equals(d);
    }

    static int levelRank(String level) {
        if (level == null) return 1;
        String n = level.toUpperCase(Locale.ROOT);
        if (n.startsWith("L3")) return 3;
        if (n.startsWith("L2")) return 2;
        return 1;
    }

    static String nextLevel(String current) {
        int r = levelRank(current);
        if (r >= 3) return "L3";
        if (r == 2) return "L3";
        return "L2";
    }
}
