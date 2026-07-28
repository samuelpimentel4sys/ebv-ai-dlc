package br.com.ebv.prisma.domain.reason.port.in;

import java.util.List;
import java.util.UUID;

public interface ResolveReasonsUseCase {

    record ReasonHit(String code, int version, String text, String channel) {}

    record Result(UUID decisionId, String outcome, String channel, List<ReasonHit> reasons) {}

    Result execute(UUID decisionId, String channel);
}
