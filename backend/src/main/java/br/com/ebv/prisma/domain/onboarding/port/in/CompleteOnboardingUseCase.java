package br.com.ebv.prisma.domain.onboarding.port.in;

import java.util.List;
import java.util.UUID;

public interface CompleteOnboardingUseCase {

    record Command(UUID id, String contractVersion, boolean accepted, String billingEmail) {}

    record CredentialView(
            UUID id, String clientId, String secret, List<String> scopes, String env
    ) {}

    record Result(UUID onboardingId, String status, String tenantId, CredentialView credential, long durationSeconds) {}

    Result execute(Command command);
}
