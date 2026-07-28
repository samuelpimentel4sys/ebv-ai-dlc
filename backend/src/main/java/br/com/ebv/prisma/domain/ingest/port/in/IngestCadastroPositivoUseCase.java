package br.com.ebv.prisma.domain.ingest.port.in;

import java.time.OffsetDateTime;

/** Conector Cadastro Positivo (NiFi/batch) → contrato F01. RN002. */
public interface IngestCadastroPositivoUseCase {

    record RecordCommand(
            String documento,
            String naturalKey,
            OffsetDateTime eventTs,
            String payloadCanonical
    ) {}

    record RecordResult(String status, int eventsPublished, int deduplicated, int reconciliation) {}

    RecordResult execute(RecordCommand command);
}
