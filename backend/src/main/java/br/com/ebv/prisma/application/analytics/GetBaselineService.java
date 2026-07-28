package br.com.ebv.prisma.application.analytics;

import br.com.ebv.prisma.domain.analytics.port.in.GetBaselineUseCase;
import br.com.ebv.prisma.domain.analytics.port.out.AnalyticsRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class GetBaselineService implements GetBaselineUseCase {

    private final AnalyticsRepositoryPort analyticsRepo;

    public GetBaselineService(AnalyticsRepositoryPort analyticsRepo) {
        this.analyticsRepo = analyticsRepo;
    }

    @Override
    @Transactional(readOnly = true)
    public Result execute() {
        List<BaselineItem> items = new ArrayList<>();
        analyticsRepo.findByKey("BASELINE_DEFLECTION").forEach(m ->
                items.add(new BaselineItem(m.metricKey(), m.channel(), m.metricValue(), m.periodFrom(), m.periodTo())));
        analyticsRepo.findByKey("BASELINE_SAC_COST").forEach(m ->
                items.add(new BaselineItem(m.metricKey(), m.channel(), m.metricValue(), m.periodFrom(), m.periodTo())));
        return new Result("pre-prisma", items);
    }
}
