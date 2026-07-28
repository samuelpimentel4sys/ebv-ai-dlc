package br.com.ebv.prisma.domain.consent.port.in;

import java.util.List;
import java.util.UUID;

public interface ListConsentsUseCase {
    record Query(String documento) {}
    record Item(UUID consentId, String purposeCode, String sourceCode, String status) {}
    record Result(String documento, List<Item> consents) {}

    Result execute(Query query);
}
