package br.com.ebv.prisma.application.events;

import br.com.ebv.prisma.domain.events.port.in.GetCreditEventUseCase;
import br.com.ebv.prisma.domain.events.port.out.CreditEventReceiptPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class GetCreditEventService implements GetCreditEventUseCase {

    private final CreditEventReceiptPort receiptPort;

    public GetCreditEventService(CreditEventReceiptPort receiptPort) {
        this.receiptPort = receiptPort;
    }

    @Override
    public Optional<EventView> execute(UUID eventId) {
        return receiptPort.findById(eventId).map(r -> new EventView(
                r.eventId(),
                r.documento(),
                r.eventType(),
                r.topic(),
                r.partition(),
                r.offset(),
                r.schemaVersion(),
                "ACCEPTED"
        ));
    }
}
