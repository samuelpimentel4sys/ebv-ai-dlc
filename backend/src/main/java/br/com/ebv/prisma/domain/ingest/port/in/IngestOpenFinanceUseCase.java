package br.com.ebv.prisma.domain.ingest.port.in;

import java.util.List;
import java.util.UUID;

public interface IngestOpenFinanceUseCase {

    record CallbackCommand(
            String consentId,
            String documento,
            List<String> resources,
            UUID idempotencyKey
    ) {}

    record CallbackResult(boolean accepted, int eventsPublished, int deduplicated, String status) {}

    CallbackResult execute(CallbackCommand command);
}
