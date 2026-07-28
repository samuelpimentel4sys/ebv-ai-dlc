package br.com.ebv.prisma.domain.identity.port.in;

import br.com.ebv.prisma.domain.identity.model.GoldenRecord;
import br.com.ebv.prisma.domain.identity.model.GoldenRecordId;

import java.util.UUID;

/** CA-04 / RN002 — desfaz merge e republica evento de correção. */
public interface UndoMergeUseCase {

    record UndoCommand(GoldenRecordId survivorGrId, GoldenRecordId mergedGrId, UUID actorId) {}

    record UndoResult(GoldenRecord restored, GoldenRecord survivor, String kafkaTopic, Long kafkaOffset) {}

    UndoResult execute(UndoCommand command);
}
