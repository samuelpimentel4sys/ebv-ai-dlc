package br.com.ebv.prisma.domain.utilitylink.port.in;

import java.util.List;
import java.util.UUID;

public interface ListUtilityLinksUseCase {
    record Query(String documento) {}
    record Item(UUID linkId, String partnerCode, String accountRef, String utilityType, String status) {}
    record Result(List<Item> links) {}
    Result execute(Query query);
}
