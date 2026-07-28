package br.com.ebv.prisma.application.ingest;

import br.com.ebv.prisma.domain.events.exception.UnprocessableEventException;
import br.com.ebv.prisma.domain.events.model.CreditEventType;
import br.com.ebv.prisma.domain.events.port.in.PublishCreditEventUseCase;
import br.com.ebv.prisma.domain.ingest.port.in.IngestCadastroPositivoUseCase;
import br.com.ebv.prisma.domain.ingest.port.out.IngestRepositoryPort;
import br.com.ebv.prisma.domain.ingest.service.DedupDecisionService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Map;
import java.util.UUID;

@Service
public class IngestCadastroPositivoService implements IngestCadastroPositivoUseCase {

    private static final String SOURCE = "CADASTRO_POSITIVO";

    private final IngestRepositoryPort ingestRepository;
    private final PublishCreditEventUseCase publishCreditEvent;

    public IngestCadastroPositivoService(
            IngestRepositoryPort ingestRepository,
            PublishCreditEventUseCase publishCreditEvent
    ) {
        this.ingestRepository = ingestRepository;
        this.publishCreditEvent = publishCreditEvent;
    }

    @Override
    @Transactional
    public RecordResult execute(RecordCommand command) {
        if (command.documento() == null || command.naturalKey() == null || command.eventTs() == null
                || command.payloadCanonical() == null || command.payloadCanonical().isBlank()) {
            throw new UnprocessableEventException("Map fail Cad. Positivo — campos obrigatórios");
        }

        String documento = command.documento().replaceAll("\\D", "");
        if (documento.length() != 11 && documento.length() != 14) {
            throw new UnprocessableEventException("Map fail Cad. Positivo — documento inválido");
        }

        String payloadHash = sha256(command.payloadCanonical());
        var existing = ingestRepository.findDedup(SOURCE, command.naturalKey(), command.eventTs());
        String existingHash = existing.map(IngestRepositoryPort.DedupRecord::payloadHash).orElse(null);

        DedupDecisionService.Outcome outcome = DedupDecisionService.decide(existingHash, payloadHash);
        return switch (outcome) {
            case DEDUPLICATE -> new RecordResult("DEDUPLICATED", 0, 1, 0);
            case RECONCILE -> {
                ingestRepository.touchSourceSuccess(SOURCE);
                yield new RecordResult("RECONCILIATION", 0, 0, 1);
            }
            case PUBLISH -> {
                publishCreditEvent.execute(new PublishCreditEventUseCase.PublishCommand(
                        CreditEventType.PAGAMENTO,
                        documento,
                        Instant.from(command.eventTs()),
                        Map.of(
                                "source", SOURCE,
                                "naturalKey", command.naturalKey(),
                                "payload", command.payloadCanonical()
                        ),
                        UUID.nameUUIDFromBytes((SOURCE + "|" + command.naturalKey() + "|" + command.eventTs())
                                .getBytes(StandardCharsets.UTF_8))
                ));
                ingestRepository.saveDedup(SOURCE, command.naturalKey(), command.eventTs(), payloadHash);
                ingestRepository.touchSourceSuccess(SOURCE);
                yield new RecordResult("NORMALIZED", 1, 0, 0);
            }
        };
    }

    private static String sha256(String raw) {
        try {
            return HexFormat.of().formatHex(
                    MessageDigest.getInstance("SHA-256").digest(raw.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException("hash fail", e);
        }
    }
}
