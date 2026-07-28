package br.com.ebv.prisma.domain.analytics.port.in;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface GetSacCostUseCase {

    record Query(LocalDate from, LocalDate to) {}

    record ChannelCost(String channel, BigDecimal avgCost, String currency) {}

    record Result(LocalDate from, LocalDate to, List<ChannelCost> channels) {}

    Result execute(Query query);
}
