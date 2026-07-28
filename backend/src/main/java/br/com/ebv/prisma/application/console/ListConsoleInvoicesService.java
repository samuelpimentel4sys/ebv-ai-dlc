package br.com.ebv.prisma.application.console;

import br.com.ebv.prisma.domain.console.port.in.ListConsoleInvoicesUseCase;
import br.com.ebv.prisma.domain.console.port.out.ConsoleRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ListConsoleInvoicesService implements ListConsoleInvoicesUseCase {

    private final ConsoleRepositoryPort consoleRepo;

    public ListConsoleInvoicesService(ConsoleRepositoryPort consoleRepo) {
        this.consoleRepo = consoleRepo;
    }

    @Override
    @Transactional(readOnly = true)
    public List<InvoiceItem> execute(Query query) {
        String tenantId = (query.tenantId() == null || query.tenantId().isBlank())
                ? "demo-tenant" : query.tenantId().trim();
        return consoleRepo.findInvoicesByTenant(tenantId).stream()
                .map(i -> new InvoiceItem(
                        i.id(), i.invoiceNumber(), i.periodLabel(), i.amount(), i.currency(), i.status(), i.issuedAt()
                ))
                .toList();
    }
}
