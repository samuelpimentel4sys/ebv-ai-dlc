package br.com.ebv.prisma.domain.identity.exception;

import br.com.ebv.prisma.domain.identity.model.GoldenRecordId;

/** RN004 — merge cíclico → HTTP 409. */
public class CyclicMergeException extends RuntimeException {
    public CyclicMergeException(GoldenRecordId survivor, GoldenRecordId merged) {
        super("Merge cíclico detectado survivor=" + survivor.value() + " merged=" + merged.value());
    }
}
