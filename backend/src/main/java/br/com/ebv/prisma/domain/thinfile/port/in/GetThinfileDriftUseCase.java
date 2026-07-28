package br.com.ebv.prisma.domain.thinfile.port.in;

import java.math.BigDecimal;
import java.util.List;

public interface GetThinfileDriftUseCase {
    record Item(String featureName, BigDecimal psi, String severity, boolean vulnerableSegment) {}
    record Result(List<Item> metrics) {}
    Result execute();
}
