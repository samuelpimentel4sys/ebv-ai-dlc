package br.com.ebv.prisma.infrastructure.adapter.persistence.console;

import br.com.ebv.prisma.domain.console.port.out.ConsoleRepositoryPort;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@Transactional(readOnly = true)
public class ConsoleRepositoryAdapter implements ConsoleRepositoryPort {

    private final ConsoleUsageJpaRepository usageJpa;
    private final ConsoleInvoiceJpaRepository invoiceJpa;
    private final ConsoleContractJpaRepository contractJpa;

    public ConsoleRepositoryAdapter(
            ConsoleUsageJpaRepository usageJpa,
            ConsoleInvoiceJpaRepository invoiceJpa,
            ConsoleContractJpaRepository contractJpa
    ) {
        this.usageJpa = usageJpa;
        this.invoiceJpa = invoiceJpa;
        this.contractJpa = contractJpa;
    }

    @Override
    public List<UsageRecord> findUsageByTenant(String tenantId) {
        return usageJpa.findByTenantId(tenantId).stream()
                .map(u -> new UsageRecord(
                        u.getId(), u.getTenantId(), u.getProductCode(), u.getEnvironment(),
                        u.getCallCount(), u.getAmount(), u.getCurrency(),
                        u.getPeriodStart(), u.getPeriodEnd(), u.getFreshnessAt().toInstant()
                ))
                .toList();
    }

    @Override
    public List<InvoiceRecord> findInvoicesByTenant(String tenantId) {
        return invoiceJpa.findByTenantId(tenantId).stream()
                .map(i -> new InvoiceRecord(
                        i.getId(), i.getTenantId(), i.getInvoiceNumber(), i.getPeriodLabel(),
                        i.getAmount(), i.getCurrency(), i.getStatus(), i.getIssuedAt().toInstant()
                ))
                .toList();
    }

    @Override
    public List<ContractRecord> findContractsByTenant(String tenantId) {
        return contractJpa.findByTenantId(tenantId).stream()
                .map(c -> new ContractRecord(
                        c.getId(), c.getTenantId(), c.getContractCode(), c.getVersion(),
                        c.getStatus(), c.getAcceptedAt() == null ? null : c.getAcceptedAt().toInstant()
                ))
                .toList();
    }
}
