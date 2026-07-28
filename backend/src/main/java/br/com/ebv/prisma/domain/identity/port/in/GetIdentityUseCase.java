package br.com.ebv.prisma.domain.identity.port.in;

import br.com.ebv.prisma.domain.identity.model.GoldenRecord;

public interface GetIdentityUseCase {
    GoldenRecord execute(String documento);
}
