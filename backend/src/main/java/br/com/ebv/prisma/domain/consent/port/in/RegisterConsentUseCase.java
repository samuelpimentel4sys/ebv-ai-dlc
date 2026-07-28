package br.com.ebv.prisma.domain.consent.port.in;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface RegisterConsentUseCase {
    record Item(String purposeCode, String sourceCode, boolean accepted, Instant validTo) {}
    record Command(String documento, List<Item> items, String channel, String versionTermo) {}
    record ResultItem(UUID consentId, String purposeCode, String sourceCode, String status) {}
    record Result(String documentoHash, List<ResultItem> items) {}

    Result execute(Command command);
}
