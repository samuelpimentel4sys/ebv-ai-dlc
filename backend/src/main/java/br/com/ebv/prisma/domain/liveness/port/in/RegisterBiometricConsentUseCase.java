package br.com.ebv.prisma.domain.liveness.port.in;

import java.util.UUID;

public interface RegisterBiometricConsentUseCase {

    record Command(UUID customerId, String termVersion, String ipAddress, String userAgent) {}

    record Result(UUID customerId, String termVersion, String status) {}

    Result execute(Command command);
}
