package br.com.ebv.prisma.domain.policysim.port.in;

import java.time.LocalDate;

public interface GetPolicyBaselineUseCase {

    record Query(String portfolio, LocalDate asOfDate) {}

    record Result(
            String baselineVersion,
            String status,
            String portfolio,
            LocalDate asOfDate,
            String artifactHash,
            boolean stub
    ) {}

    Result execute(Query query);
}
