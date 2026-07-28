package br.com.ebv.prisma.domain.counterfactual.port.in;

import java.util.List;
import java.util.UUID;

public interface SimulateCounterfactualUseCase {

    Result execute(Command command);

    record Change(String attributeCode, Object proposedValue) {}

    record Command(UUID decisionId, List<Change> changes, String targetBand) {}

    record Result(
            UUID decisionId,
            String targetBand,
            boolean wouldApprove,
            int estimatedScore,
            String disclaimerVersion
    ) {}
}
