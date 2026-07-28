package br.com.ebv.prisma.domain.onboarding.port.in;

import java.util.UUID;

public interface VerifyOnboardingUseCase {

    record Command(UUID id, boolean forceManualQueue) {}

    record Result(UUID id, String status, String verification) {}

    Result execute(Command command);
}
