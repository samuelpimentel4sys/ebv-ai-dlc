package br.com.ebv.prisma.domain.utilitylink.port.in;

import java.util.UUID;

public interface UnlinkUtilityUseCase {
    record Command(UUID linkId) {}
    record Result(UUID linkId, String status) {}
    Result execute(Command command);
}
