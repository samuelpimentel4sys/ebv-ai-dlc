package br.com.ebv.prisma.domain.identity.port.out;

import br.com.ebv.prisma.domain.identity.model.GoldenRecordId;

import java.util.UUID;

/** Publica correção de identidade (merge/undo) no barramento F01. */
public interface IdentityCorrectionPublisherPort {

    record CorrectionEvent(
            UUID eventId,
            String action,
            GoldenRecordId fromGr,
            GoldenRecordId toGr,
            String survivorDocumento,
            int survivorVersion,
            UUID actorId
    ) {}

    record PublishAck(String topic, int partition, long offset) {}

    PublishAck publish(CorrectionEvent event);
}
