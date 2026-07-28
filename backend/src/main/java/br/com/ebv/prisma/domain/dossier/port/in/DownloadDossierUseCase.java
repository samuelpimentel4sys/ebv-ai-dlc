package br.com.ebv.prisma.domain.dossier.port.in;

import java.util.UUID;

public interface DownloadDossierUseCase {

    Result execute(UUID dossierId, String format);

    record Result(String format, String contentType, byte[] body) {}
}
