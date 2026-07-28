package br.com.ebv.prisma.domain.credential.port.in;

import java.util.List;
import java.util.UUID;

public interface CreateCredentialUseCase {

    record Command(String tenantId, List<String> scopes, String env, Integer rateLimit) {}

    record Result(UUID id, String clientId, String secret, List<String> scopes, String env, String status) {}

    Result execute(Command command);
}
