package br.com.ebv.prisma.domain.observability.exception;

import java.util.UUID;

public class TraceNotFoundException extends RuntimeException {
    public TraceNotFoundException(UUID decisionId) {
        super("Trace não encontrado ou expirado: " + decisionId);
    }
}
