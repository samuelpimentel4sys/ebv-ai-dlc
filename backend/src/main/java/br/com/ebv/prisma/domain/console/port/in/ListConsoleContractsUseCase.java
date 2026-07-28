package br.com.ebv.prisma.domain.console.port.in;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface ListConsoleContractsUseCase {

    record Query(String tenantId) {}

    record ContractItem(UUID id, String contractCode, String version, String status, Instant acceptedAt) {}

    List<ContractItem> execute(Query query);
}
