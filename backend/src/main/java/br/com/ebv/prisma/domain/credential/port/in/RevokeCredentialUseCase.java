package br.com.ebv.prisma.domain.credential.port.in;

import java.util.UUID;

public interface RevokeCredentialUseCase {

    record Command(UUID id) {}

    void execute(Command command);
}
