package br.com.ebv.prisma.domain.console.port.in;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface ListConsoleInvoicesUseCase {

    record Query(String tenantId) {}

    record InvoiceItem(
            UUID id, String invoiceNumber, String periodLabel, BigDecimal amount, String currency, String status, Instant issuedAt
    ) {}

    List<InvoiceItem> execute(Query query);
}
