package br.com.ebv.prisma.domain.policy.port.in;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface DiffPolicyVersionsUseCase {

    record DiffChange(String path, Object fromValue, Object toValue, String changeType, String businessEffect) {}

    record Result(
            UUID fromVersionId,
            UUID toVersionId,
            String fromVersion,
            String toVersion,
            List<DiffChange> changes,
            List<String> businessEffects
    ) {}

    Result execute(UUID fromId, UUID toId, boolean includeUnchanged);
}
