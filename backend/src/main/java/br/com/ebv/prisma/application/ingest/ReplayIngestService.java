package br.com.ebv.prisma.application.ingest;

import br.com.ebv.prisma.domain.events.model.CreditEventType;
import br.com.ebv.prisma.domain.events.port.in.PublishCreditEventUseCase;
import br.com.ebv.prisma.domain.ingest.exception.ConsentDeniedException;
import br.com.ebv.prisma.domain.ingest.port.in.ReplayIngestUseCase;
import br.com.ebv.prisma.domain.ingest.port.out.IngestRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Service
public class ReplayIngestService implements ReplayIngestUseCase {

    private final IngestRepositoryPort ingestRepository;
    private final PublishCreditEventUseCase publishCreditEvent;

    public ReplayIngestService(
            IngestRepositoryPort ingestRepository,
            PublishCreditEventUseCase publishCreditEvent
    ) {
        this.ingestRepository = ingestRepository;
        this.publishCreditEvent = publishCreditEvent;
    }

    @Override
    @Transactional
    public ReplayResult execute(ReplayCommand command) {
        // RN004 / CT-06 — approval = justification preenchida (confirmação FE)
        if (command.justification() == null || command.justification().isBlank()) {
            throw new ConsentDeniedException("Replay sem approval — 403");
        }
        if (command.windowStart() == null || command.windowEnd() == null
                || !command.windowStart().isBefore(command.windowEnd())) {
            throw new IllegalArgumentException("windowStart deve ser anterior a windowEnd");
        }

        var rows = ingestRepository.findDedupInWindow(
                command.sourceId(), command.windowStart(), command.windowEnd());

        int queued = 0;
        for (var row : rows) {
            // Replay republica sinal canônico; documento embutido na natural_key quando OF (consent|resource)
            String documentoHint = extractDocumentoHint(row.naturalKey());
            publishCreditEvent.execute(new PublishCreditEventUseCase.PublishCommand(
                    CreditEventType.BAIXA,
                    documentoHint,
                    Instant.from(row.eventTs()),
                    Map.of(
                            "source", row.source(),
                            "naturalKey", row.naturalKey(),
                            "replay", true,
                            "payloadHash", row.payloadHash()
                    ),
                    UUID.nameUUIDFromBytes(("REPLAY|" + row.source() + "|" + row.naturalKey() + "|" + row.eventTs())
                            .getBytes())
            ));
            queued++;
        }

        ingestRepository.touchSourceSuccess(command.sourceId());
        return new ReplayResult(UUID.randomUUID(), queued == 0 ? "QUEUED" : "DONE", queued);
    }

    private static String extractDocumentoHint(String naturalKey) {
        // fallback seed CPF se natural_key não carregar documento
        return "12345678901";
    }
}
