package br.com.ebv.prisma.domain.altdata.port.in;

import java.util.List;

public interface GetAltCoverageUseCase {
    record Item(String partnerCode, String region, long coveredTitulares) {}
    record Result(List<Item> coverage) {}
    Result execute();
}
