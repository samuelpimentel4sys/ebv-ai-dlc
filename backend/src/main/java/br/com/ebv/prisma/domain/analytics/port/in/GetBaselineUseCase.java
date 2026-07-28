package br.com.ebv.prisma.domain.analytics.port.in;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface GetBaselineUseCase {

    record BaselineItem(String metricKey, String channel, BigDecimal value, LocalDate periodFrom, LocalDate periodTo) {}

    record Result(String label, List<BaselineItem> items) {}

    Result execute();
}
