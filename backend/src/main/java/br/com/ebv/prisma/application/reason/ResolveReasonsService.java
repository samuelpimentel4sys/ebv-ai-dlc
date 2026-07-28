package br.com.ebv.prisma.application.reason;

import br.com.ebv.prisma.domain.decision.exception.DecisionNotFoundException;
import br.com.ebv.prisma.domain.decision.port.out.DecisionRepositoryPort;
import br.com.ebv.prisma.domain.reason.exception.ReasonValidationException;
import br.com.ebv.prisma.domain.reason.port.in.ResolveReasonsUseCase;
import br.com.ebv.prisma.domain.reason.port.out.ReasonVersionRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class ResolveReasonsService implements ResolveReasonsUseCase {

    private static final Set<String> CHANNELS = Set.of("APP", "PORTAL", "LETTER");

    private final DecisionRepositoryPort decisionRepo;
    private final ReasonVersionRepositoryPort reasonRepo;

    public ResolveReasonsService(DecisionRepositoryPort decisionRepo, ReasonVersionRepositoryPort reasonRepo) {
        this.decisionRepo = decisionRepo;
        this.reasonRepo = reasonRepo;
    }

    @Override
    @Transactional(readOnly = true)
    public Result execute(UUID decisionId, String channel) {
        if (channel == null || channel.isBlank()) {
            throw new ReasonValidationException("channel obrigatório (APP|PORTAL|LETTER)");
        }
        String ch = channel.trim().toUpperCase(Locale.ROOT);
        if (!CHANNELS.contains(ch)) {
            throw new ReasonValidationException("channel não suportado: " + channel);
        }

        var decision = decisionRepo.findById(decisionId)
                .orElseThrow(() -> new DecisionNotFoundException(decisionId));

        String outcome = decision.outcome() == null ? "" : decision.outcome().toUpperCase(Locale.ROOT);

        // APPROVE → empty reasons OK; REJECT/REVIEW → catalog stub (no SHAP)
        if ("APPROVE".equals(outcome)) {
            return new Result(decisionId, outcome, ch, List.of());
        }

        List<ReasonHit> hits = reasonRepo.findApprovedForChannel(ch).stream()
                .map(r -> new ReasonHit(r.code(), r.version(), pickText(r, ch), ch))
                .toList();
        return new Result(decisionId, outcome, ch, hits);
    }

    private static String pickText(ReasonVersionRepositoryPort.ReasonVersionRecord r, String channel) {
        // LETTER prefers consumer; analyst for internal — lab: consumer for all channels
        return r.consumerText();
    }
}
