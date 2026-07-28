package br.com.ebv.prisma.domain.console.port.out;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface ConsoleRepositoryPort {

    record UsageRecord(
            UUID id, String tenantId, String productCode, String environment,
            long callCount, BigDecimal amount, String currency,
            LocalDate periodStart, LocalDate periodEnd, Instant freshnessAt
    ) {}

    record InvoiceRecord(
            UUID id, String tenantId, String invoiceNumber, String periodLabel,
            BigDecimal amount, String currency, String status, Instant issuedAt
    ) {}

    record ContractRecord(
            UUID id, String tenantId, String contractCode, String version, String status, Instant acceptedAt
    ) {}

    List<UsageRecord> findUsageByTenant(String tenantId);

    List<InvoiceRecord> findInvoicesByTenant(String tenantId);

    List<ContractRecord> findContractsByTenant(String tenantId);
}
