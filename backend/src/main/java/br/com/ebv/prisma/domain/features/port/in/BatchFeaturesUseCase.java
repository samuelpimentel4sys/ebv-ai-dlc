package br.com.ebv.prisma.domain.features.port.in;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public interface BatchFeaturesUseCase {

    record BatchItem(String documento, Instant asOf, List<String> names) {}

    record BatchResult(List<GetFeaturesUseCase.FeaturesResult> items) {}

    BatchResult execute(List<BatchItem> items);
}
