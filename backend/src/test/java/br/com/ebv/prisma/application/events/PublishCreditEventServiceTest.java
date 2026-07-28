package br.com.ebv.prisma.application.events;

import br.com.ebv.prisma.domain.events.exception.UnprocessableEventException;
import br.com.ebv.prisma.domain.events.model.CreditEventType;
import br.com.ebv.prisma.domain.events.port.in.PublishCreditEventUseCase;
import br.com.ebv.prisma.domain.events.port.out.CreditEventPublisherPort;
import br.com.ebv.prisma.domain.events.port.out.CreditEventReceiptPort;
import br.com.ebv.prisma.domain.events.port.out.SchemaCompatibilityPort;
import br.com.ebv.prisma.domain.events.service.DocumentPartitioning;
import br.com.ebv.prisma.infrastructure.adapter.messaging.AllowlistSchemaCompatibilityAdapter;
import br.com.ebv.prisma.infrastructure.adapter.messaging.LocalCreditEventPublisher;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PublishCreditEventServiceTest {

    @Mock
    CreditEventReceiptPort receiptPort;

    @Test
    @DisplayName("CT-02 sem documento → DLQ + UnprocessableEventException")
    void missingDocumentGoesToDlq() {
        var service = new PublishCreditEventService(
                new LocalCreditEventPublisher("t", 6),
                receiptPort,
                new AllowlistSchemaCompatibilityAdapter("CreditEvent:1"),
                new ObjectMapper(),
                "prisma.credit.events",
                6,
                "CreditEvent:1"
        );

        assertThatThrownBy(() -> service.execute(new PublishCreditEventUseCase.PublishCommand(
                CreditEventType.NEGATIVACAO, "abc", Instant.now(), Map.of(), null
        ))).isInstanceOf(UnprocessableEventException.class);

        verify(receiptPort).saveDlq(anyString(), anyString());
    }

    @Test
    @DisplayName("CT-04 idempotência mesma key → DUPLICATE")
    void idempotentDuplicate() {
        UUID key = UUID.randomUUID();
        when(receiptPort.findByIdempotencyKey(key)).thenReturn(Optional.of(
                new CreditEventReceiptPort.Receipt(key, "12345678901", "NEGATIVACAO", "t", 1, 9L, "CreditEvent:1")
        ));

        var service = new PublishCreditEventService(
                new LocalCreditEventPublisher("t", 6),
                receiptPort,
                new AllowlistSchemaCompatibilityAdapter("CreditEvent:1"),
                new ObjectMapper(),
                "prisma.credit.events",
                6,
                "CreditEvent:1"
        );

        var result = service.execute(new PublishCreditEventUseCase.PublishCommand(
                CreditEventType.NEGATIVACAO, "12345678901", Instant.now(), Map.of(), key
        ));
        assertThat(result.status()).isEqualTo("DUPLICATE");
        assertThat(result.eventId()).isEqualTo(key);
    }

    @Test
    @DisplayName("CT-05 mesmo documento mesma partition")
    void sameDocumentSamePartition() {
        CreditEventPublisherPort publisher = request -> {
            int p = DocumentPartitioning.partitionFor(request.documento(), 6);
            return new CreditEventPublisherPort.PublishAck("t", p, 1L);
        };
        SchemaCompatibilityPort schema = new AllowlistSchemaCompatibilityAdapter("CreditEvent:1");
        var service = new PublishCreditEventService(
                publisher, receiptPort, schema, new ObjectMapper(), "t", 6, "CreditEvent:1"
        );

        var r1 = service.execute(new PublishCreditEventUseCase.PublishCommand(
                CreditEventType.BAIXA, "12345678901", Instant.now(), Map.of(), null
        ));
        var r2 = service.execute(new PublishCreditEventUseCase.PublishCommand(
                CreditEventType.BAIXA, "12345678901", Instant.now(), Map.of(), null
        ));
        assertThat(r1.partition()).isEqualTo(r2.partition());
    }
}
