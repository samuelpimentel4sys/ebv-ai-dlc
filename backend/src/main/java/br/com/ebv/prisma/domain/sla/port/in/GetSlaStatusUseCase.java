package br.com.ebv.prisma.domain.sla.port.in;

import java.time.Instant;
import java.util.List;

public interface GetSlaStatusUseCase {

    record Query(String window) {}

    record AtRiskItem(String protocol, long businessDaysRemaining, String stage, String assignedTo) {}

    record Counts(long onTrack, long atRisk, long overdue) {}

    record Result(Instant asOf, Counts counts, List<AtRiskItem> atRiskSample, int escalationsCreated) {}

    Result execute(Query query);
}
