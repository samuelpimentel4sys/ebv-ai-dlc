package br.com.ebv.prisma.application.features;

import br.com.ebv.prisma.domain.features.port.in.BatchFeaturesUseCase;
import br.com.ebv.prisma.domain.features.port.in.GetFeaturesUseCase;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class BatchFeaturesService implements BatchFeaturesUseCase {

    private final GetFeaturesUseCase getFeatures;

    public BatchFeaturesService(GetFeaturesUseCase getFeatures) {
        this.getFeatures = getFeatures;
    }

    @Override
    @Transactional(readOnly = true)
    public BatchResult execute(List<BatchItem> items) {
        List<GetFeaturesUseCase.FeaturesResult> out = new ArrayList<>();
        for (BatchItem item : items) {
            out.add(getFeatures.execute(item.documento(), item.asOf(), item.names()));
        }
        return new BatchResult(out);
    }
}
