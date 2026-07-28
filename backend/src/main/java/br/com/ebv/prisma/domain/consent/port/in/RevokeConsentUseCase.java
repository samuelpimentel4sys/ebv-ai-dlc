package br.com.ebv.prisma.domain.consent.port.in;

import java.util.UUID;

public interface RevokeConsentUseCase {
    record Command(UUID consentId) {}
    record Result(UUID consentId, String status) {}

    Result execute(Command command);
}
