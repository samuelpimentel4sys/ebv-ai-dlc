package br.com.ebv.prisma.domain.identity.exception;

import br.com.ebv.prisma.domain.identity.model.GoldenRecordId;

/** Merge não encontrado ou já desfeito. */
public class MergeUndoNotAllowedException extends RuntimeException {

    public MergeUndoNotAllowedException(GoldenRecordId survivor, GoldenRecordId merged, String reason) {
        super("Undo não permitido survivor=" + survivor.value() + " merged=" + merged.value() + ": " + reason);
    }
}
