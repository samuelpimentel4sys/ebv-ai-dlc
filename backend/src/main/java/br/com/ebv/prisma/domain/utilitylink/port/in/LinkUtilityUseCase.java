package br.com.ebv.prisma.domain.utilitylink.port.in;

import java.util.UUID;

public interface LinkUtilityUseCase {
    record Command(String documento, String partnerCode, String accountRef, String utilityType, String holderName) {}
    record Result(UUID linkId, String status, boolean sourceConfirmed, double nameMatchScore) {}
    Result execute(Command command);
}
