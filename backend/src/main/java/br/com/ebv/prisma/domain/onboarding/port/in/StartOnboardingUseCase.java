package br.com.ebv.prisma.domain.onboarding.port.in;

import java.util.UUID;

public interface StartOnboardingUseCase {

    record Command(String cnpj, String legalName, String representative) {}

    record Result(UUID id, String status) {}

    Result execute(Command command);
}
