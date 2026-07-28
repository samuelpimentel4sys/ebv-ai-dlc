package br.com.ebv.prisma.application.ingest;

import br.com.ebv.prisma.domain.events.port.in.PublishCreditEventUseCase;
import br.com.ebv.prisma.domain.ingest.exception.ConsentDeniedException;
import br.com.ebv.prisma.domain.ingest.port.in.IngestCadastroPositivoUseCase;
import br.com.ebv.prisma.domain.ingest.port.in.IngestOpenFinanceUseCase;
import br.com.ebv.prisma.domain.ingest.port.in.ReplayIngestUseCase;
import br.com.ebv.prisma.domain.ingest.port.out.IngestRepositoryPort;
import br.com.ebv.prisma.domain.ingest.service.DedupDecisionService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class IngestUseCasesTest {

    @Mock
    IngestRepositoryPort ingestRepository;
    @Mock
    PublishCreditEventUseCase publishCreditEvent;

    @Test
    @DisplayName("CT-02 consentimento expirado → 403")
    void expiredConsent() {
        when(ingestRepository.findConsent("12345678901", "OPEN_FINANCE_SCORE"))
                .thenReturn(Optional.of(new IngestRepositoryPort.ConsentRecord(
                        "12345678901", "OPEN_FINANCE_SCORE", "ACTIVE",
                        OffsetDateTime.now(ZoneOffset.UTC).minusDays(1)
                )));
        var service = new IngestOpenFinanceService(ingestRepository, publishCreditEvent);

        assertThatThrownBy(() -> service.execute(new IngestOpenFinanceUseCase.CallbackCommand(
                "urn:consent:1", "12345678901", List.of("accounts"), null
        ))).isInstanceOf(ConsentDeniedException.class);
        verify(publishCreditEvent, never()).execute(any());
    }

    @Test
    @DisplayName("CT-01 callback com consentimento publica F01")
    void callbackWithConsent() {
        when(ingestRepository.findConsent("12345678901", "OPEN_FINANCE_SCORE"))
                .thenReturn(Optional.of(new IngestRepositoryPort.ConsentRecord(
                        "12345678901", "OPEN_FINANCE_SCORE", "ACTIVE",
                        OffsetDateTime.now(ZoneOffset.UTC).plusDays(30)
                )));
        when(ingestRepository.findDedup(any(), any(), any())).thenReturn(Optional.empty());
        when(publishCreditEvent.execute(any())).thenReturn(
                new PublishCreditEventUseCase.PublishResult(UUID.randomUUID(), "t", 0, 1L, "CreditEvent:1", "ACCEPTED")
        );

        var service = new IngestOpenFinanceService(ingestRepository, publishCreditEvent);
        var result = service.execute(new IngestOpenFinanceUseCase.CallbackCommand(
                "urn:consent:1", "12345678901", List.of("accounts"), UUID.randomUUID()
        ));

        assertThat(result.accepted()).isTrue();
        assertThat(result.eventsPublished()).isEqualTo(1);
        assertThat(result.status()).isEqualTo("NORMALIZED");
    }

    @Test
    @DisplayName("CT-03 Cad. Positivo dedup descarta igual")
    void cadastroPositivoDedup() {
        OffsetDateTime ts = OffsetDateTime.parse("2026-07-28T00:00:00Z");
        String payload = "{\"contrato\":\"C1\"}";
        // pré-calcula hash igual ao serviço
        when(ingestRepository.findDedup(eq("CADASTRO_POSITIVO"), eq("NK-1"), eq(ts)))
                .thenReturn(Optional.of(new IngestRepositoryPort.DedupRecord(
                        "CADASTRO_POSITIVO", "NK-1", ts,
                        sha(payload)
                )));

        var service = new IngestCadastroPositivoService(ingestRepository, publishCreditEvent);
        var result = service.execute(new IngestCadastroPositivoUseCase.RecordCommand(
                "12345678901", "NK-1", ts, payload
        ));

        assertThat(result.status()).isEqualTo("DEDUPLICATED");
        assertThat(result.deduplicated()).isEqualTo(1);
        verify(publishCreditEvent, never()).execute(any());
    }

    @Test
    @DisplayName("CT-04 Cad. Positivo divergente → conciliação")
    void cadastroPositivoReconcile() {
        OffsetDateTime ts = OffsetDateTime.parse("2026-07-28T00:00:00Z");
        when(ingestRepository.findDedup(eq("CADASTRO_POSITIVO"), eq("NK-1"), eq(ts)))
                .thenReturn(Optional.of(new IngestRepositoryPort.DedupRecord(
                        "CADASTRO_POSITIVO", "NK-1", ts, "aaaabbbbccccdddd"
                )));

        var service = new IngestCadastroPositivoService(ingestRepository, publishCreditEvent);
        var result = service.execute(new IngestCadastroPositivoUseCase.RecordCommand(
                "12345678901", "NK-1", ts, "{\"contrato\":\"C2\"}"
        ));

        assertThat(result.status()).isEqualTo("RECONCILIATION");
        assertThat(result.reconciliation()).isEqualTo(1);
        verify(publishCreditEvent, never()).execute(any());
    }

    @Test
    @DisplayName("CT-06 replay sem justification → ConsentDeniedException")
    void replayWithoutApproval() {
        var replay = new ReplayIngestService(ingestRepository, publishCreditEvent);
        assertThatThrownBy(() -> replay.execute(new ReplayIngestUseCase.ReplayCommand(
                "OPEN_FINANCE",
                OffsetDateTime.parse("2026-07-01T00:00:00Z"),
                OffsetDateTime.parse("2026-07-02T00:00:00Z"),
                "  "
        ))).isInstanceOf(ConsentDeniedException.class);
    }

    @Test
    @DisplayName("DedupDecision RN002")
    void dedupDecision() {
        assertThat(DedupDecisionService.decide(null, "abc")).isEqualTo(DedupDecisionService.Outcome.PUBLISH);
        assertThat(DedupDecisionService.decide("abc", "abc")).isEqualTo(DedupDecisionService.Outcome.DEDUPLICATE);
        assertThat(DedupDecisionService.decide("abc", "xyz")).isEqualTo(DedupDecisionService.Outcome.RECONCILE);
    }

    private static String sha(String raw) {
        try {
            return java.util.HexFormat.of().formatHex(
                    java.security.MessageDigest.getInstance("SHA-256")
                            .digest(raw.getBytes(java.nio.charset.StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
