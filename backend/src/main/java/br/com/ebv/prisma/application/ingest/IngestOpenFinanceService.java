package br.com.ebv.prisma.application.ingest;

import br.com.ebv.prisma.domain.events.model.CreditEventType;
import br.com.ebv.prisma.domain.events.port.in.PublishCreditEventUseCase;
import br.com.ebv.prisma.domain.ingest.exception.ConsentDeniedException;
import br.com.ebv.prisma.domain.ingest.port.in.IngestOpenFinanceUseCase;
import br.com.ebv.prisma.domain.ingest.port.out.IngestRepositoryPort;
import br.com.ebv.prisma.domain.ingest.service.DedupDecisionService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class IngestOpenFinanceService implements IngestOpenFinanceUseCase {

    private static final String PURPOSE = "OPEN_FINANCE_SCORE";
    private static final String SOURCE = "OPEN_FINANCE";

    private final IngestRepositoryPort ingestRepository;
    private final PublishCreditEventUseCase publishCreditEvent;

    public IngestOpenFinanceService(
            IngestRepositoryPort ingestRepository,
            PublishCreditEventUseCase publishCreditEvent
    ) {
        this.ingestRepository = ingestRepository;
        this.publishCreditEvent = publishCreditEvent;
    }

    @Override
    @Transactional
    public CallbackResult execute(CallbackCommand command) {
        String documento = digits(command.documento());
        var consent = ingestRepository.findConsent(documento, PURPOSE)
                .orElseThrow(() -> new ConsentDeniedException("Consentimento ausente purpose=" + PURPOSE));

        if (!"ACTIVE".equalsIgnoreCase(consent.status())
                || consent.expiresAt().isBefore(OffsetDateTime.now(ZoneOffset.UTC))) {
            throw new ConsentDeniedException("Consentimento expirado ou inativo");
        }

        List<String> resources = command.resources() == null || command.resources().isEmpty()
                ? List.of("accounts")
                : command.resources();

        // Janela estável do lote (UTC day) — RN002 key+ts
        OffsetDateTime eventTs = OffsetDateTime.now(ZoneOffset.UTC).toLocalDate().atStartOfDay().atOffset(ZoneOffset.UTC);

        int published = 0;
        int deduplicated = 0;
        int reconciliation = 0;

        for (String resource : resources) {
            String naturalKey = command.consentId() + "|" + resource;
            String canonical = documento + "|" + naturalKey + "|" + String.join(",", resources);
            String payloadHash = sha256(canonical);

            var existing = ingestRepository.findDedup(SOURCE, naturalKey, eventTs);
            String existingHash = existing.map(IngestRepositoryPort.DedupRecord::payloadHash).orElse(null);
            DedupDecisionService.Outcome outcome = DedupDecisionService.decide(existingHash, payloadHash);

            switch (outcome) {
                case DEDUPLICATE -> deduplicated++;
                case RECONCILE -> reconciliation++;
                case PUBLISH -> {
                    UUID key = command.idempotencyKey() != null
                            ? UUID.nameUUIDFromBytes((command.idempotencyKey() + "|" + resource).getBytes(StandardCharsets.UTF_8))
                            : UUID.randomUUID();
                    publishCreditEvent.execute(new PublishCreditEventUseCase.PublishCommand(
                            CreditEventType.PAGAMENTO,
                            documento,
                            Instant.now(),
                            Map.of(
                                    "source", SOURCE,
                                    "consentId", command.consentId(),
                                    "resource", resource
                            ),
                            key
                    ));
                    ingestRepository.saveDedup(SOURCE, naturalKey, eventTs, payloadHash);
                    published++;
                }
            }
        }

        ingestRepository.touchSourceSuccess(SOURCE);
        return new CallbackResult(true, published, deduplicated + reconciliation, "NORMALIZED");
    }

    private static String digits(String raw) {
        if (raw == null) {
            return "";
        }
        return raw.replaceAll("\\D", "");
    }

    private static String sha256(String raw) {
        try {
            byte[] dig = MessageDigest.getInstance("SHA-256").digest(raw.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(dig);
        } catch (Exception e) {
            throw new IllegalStateException("hash fail", e);
        }
    }
}
