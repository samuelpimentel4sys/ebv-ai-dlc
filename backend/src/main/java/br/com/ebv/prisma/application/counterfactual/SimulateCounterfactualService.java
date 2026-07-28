package br.com.ebv.prisma.application.counterfactual;

import br.com.ebv.prisma.domain.counterfactual.port.in.SimulateCounterfactualUseCase;
import br.com.ebv.prisma.domain.decision.exception.DecisionNotFoundException;
import br.com.ebv.prisma.domain.decision.port.out.DecisionRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Locale;
import java.util.Set;

@Service
public class SimulateCounterfactualService implements SimulateCounterfactualUseCase {

    private static final Set<String> ACTIONABLE = Set.of(
            "CREDIT_UTILIZATION", "UTILIZATION_90D", "qtd_negativacoes", "divida_aberta"
    );

    private final DecisionRepositoryPort decisionRepo;

    public SimulateCounterfactualService(DecisionRepositoryPort decisionRepo) {
        this.decisionRepo = decisionRepo;
    }

    @Override
    @Transactional(readOnly = true)
    public Result execute(Command command) {
        if (command.decisionId() == null) {
            throw new IllegalArgumentException("decision_id obrigatório");
        }
        var decision = decisionRepo.findById(command.decisionId())
                .orElseThrow(() -> new DecisionNotFoundException(command.decisionId()));

        BigDecimal score = decision.score();
        if (command.changes() != null) {
            for (Change change : command.changes()) {
                if (change.attributeCode() == null || change.attributeCode().isBlank()) {
                    throw new IllegalArgumentException("attribute_code obrigatório em changes");
                }
                String code = change.attributeCode().trim();
                if (!ACTIONABLE.contains(code) && !ACTIONABLE.contains(code.toUpperCase(Locale.ROOT))) {
                    // RN001 lab: ignore immutable / unknown without promise
                    continue;
                }
                // Stub: each actionable improvement bumps score by +40
                score = score.add(new BigDecimal("40"));
            }
        }

        int estimated = score.intValue();
        boolean wouldApprove = estimated >= CounterfactualStubFactory.APPROVE_THRESHOLD;

        return new Result(
                command.decisionId(),
                command.targetBand(),
                wouldApprove,
                estimated,
                CounterfactualStubFactory.DISCLAIMER
        );
    }
}
