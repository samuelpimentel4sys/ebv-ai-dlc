package br.com.ebv.prisma.domain.identity.exception;

import br.com.ebv.prisma.domain.identity.model.GoldenRecordId;

public class GoldenRecordNotFoundException extends RuntimeException {
    public GoldenRecordNotFoundException(String documento) {
        super("Golden record não encontrado para documento=" + documento);
    }

    public GoldenRecordNotFoundException(GoldenRecordId id) {
        super("Golden record não encontrado id=" + id.value());
    }
}
