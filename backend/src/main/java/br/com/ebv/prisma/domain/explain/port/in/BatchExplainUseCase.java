package br.com.ebv.prisma.domain.explain.port.in;

import java.util.List;
import java.util.UUID;

public interface BatchExplainUseCase {

    Result execute(Command command);

    record Command(List<UUID> decisionIds, boolean includeFactors) {}

    record Result(List<GetExplanationUseCase.Result> items, List<UUID> missingIds) {}
}
