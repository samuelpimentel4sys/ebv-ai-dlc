package br.com.ebv.prisma.domain.dispute.port.in;

import java.util.List;
import java.util.UUID;

public interface GetEvidencePackUseCase {

    record Query(UUID disputeId) {}

    record FileEntry(UUID id, String filename, String contentType, String sha256, String storageUri) {}

    record Result(String manifestHash, List<FileEntry> files) {}

    Result execute(Query query);
}
