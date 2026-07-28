package br.com.ebv.prisma.domain.decision.port.in;

import java.util.Map;
import java.util.UUID;

public interface GetSnapshotUseCase {

    Map<String, Object> execute(UUID decisionId);
}
