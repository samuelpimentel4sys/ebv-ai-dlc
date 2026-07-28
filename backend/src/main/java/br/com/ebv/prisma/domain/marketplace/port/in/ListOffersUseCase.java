package br.com.ebv.prisma.domain.marketplace.port.in;

import java.util.List;
import java.util.UUID;

public interface ListOffersUseCase {
    record Query(String documento) {}
    record Item(UUID offerId, String partnerCode, String title, String productType, String explanation) {}
    record Result(List<Item> offers) {}
    Result execute(Query query);
}
