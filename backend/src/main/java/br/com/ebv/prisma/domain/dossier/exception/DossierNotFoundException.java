package br.com.ebv.prisma.domain.dossier.exception;

import java.util.UUID;

public class DossierNotFoundException extends RuntimeException {

    public DossierNotFoundException(UUID dossierId) {
        super("Dossiê não encontrado: " + dossierId);
    }
}
