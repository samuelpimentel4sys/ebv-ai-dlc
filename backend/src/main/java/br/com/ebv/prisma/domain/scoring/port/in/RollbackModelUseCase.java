package br.com.ebv.prisma.domain.scoring.port.in;

import java.util.List;

public interface RollbackModelUseCase {

    record Command(
            String modelId,
            String toVersion,
            List<String> approverIds
    ) {}

    record Result(
            String modelId,
            String restoredVersion,
            String previousVersion
    ) {}

    Result execute(Command cmd);
}
