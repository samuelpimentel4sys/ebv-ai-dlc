package br.com.ebv.prisma.domain.sla.port.in;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface CreateSlaPolicyUseCase {

    record Command(String name, int escalateAtPct, List<String> notifyChannels) {}

    record Result(UUID id, String name, int escalateAtPct, List<String> notifyChannels, String status, Instant createdAt) {}

    Result execute(Command command);
}
