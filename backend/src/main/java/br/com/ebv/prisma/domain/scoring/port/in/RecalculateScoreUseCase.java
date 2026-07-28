package br.com.ebv.prisma.domain.scoring.port.in;

import java.math.BigDecimal;

public interface RecalculateScoreUseCase {

    record Command(
            String documento,
            String reason,
            boolean critical
    ) {}

    record Result(
            String documento,
            BigDecimal score,
            String modelVersion,
            boolean coalesced
    ) {}

    Result execute(Command cmd);
}
