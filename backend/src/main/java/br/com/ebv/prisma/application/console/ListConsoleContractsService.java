package br.com.ebv.prisma.application.console;

import br.com.ebv.prisma.domain.console.port.in.ListConsoleContractsUseCase;
import br.com.ebv.prisma.domain.console.port.out.ConsoleRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ListConsoleContractsService implements ListConsoleContractsUseCase {

    private final ConsoleRepositoryPort consoleRepo;

    public ListConsoleContractsService(ConsoleRepositoryPort consoleRepo) {
        this.consoleRepo = consoleRepo;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ContractItem> execute(Query query) {
        String tenantId = (query.tenantId() == null || query.tenantId().isBlank())
                ? "demo-tenant" : query.tenantId().trim();
        return consoleRepo.findContractsByTenant(tenantId).stream()
                .map(c -> new ContractItem(c.id(), c.contractCode(), c.version(), c.status(), c.acceptedAt()))
                .toList();
    }
}
