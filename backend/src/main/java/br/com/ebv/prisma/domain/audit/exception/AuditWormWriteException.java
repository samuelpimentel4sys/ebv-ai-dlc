package br.com.ebv.prisma.domain.audit.exception;

/** Fail-closed when WORM audit append fails (maps to 503). */
public class AuditWormWriteException extends RuntimeException {
    public AuditWormWriteException(String message) {
        super(message);
    }

    public AuditWormWriteException(String message, Throwable cause) {
        super(message, cause);
    }
}
