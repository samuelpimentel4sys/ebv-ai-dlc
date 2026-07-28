package br.com.ebv.prisma.domain.credential.port.in;

import java.util.List;
import java.util.UUID;

public interface RotateCredentialUseCase {

    record Command(UUID id, boolean emergency, Integer overlapHours, String reason) {}

    record Result(UUID id, String clientId, String secret, List<String> scopes, String status) {}

    Result execute(Command command);
}
