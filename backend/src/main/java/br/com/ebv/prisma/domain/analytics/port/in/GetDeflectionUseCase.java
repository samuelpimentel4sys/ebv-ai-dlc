package br.com.ebv.prisma.domain.analytics.port.in;

import java.math.BigDecimal;
import java.time.LocalDate;

public interface GetDeflectionUseCase {

    record Query(LocalDate from, LocalDate to) {}

    record Result(
            LocalDate from,
            LocalDate to,
            BigDecimal deflectionRate,
            long deflectedCases,
            long totalCases,
            long reclassified48h,
            BigDecimal baselineDeflectionRate,
            BigDecimal deltaPp
    ) {}

    Result execute(Query query);
}
