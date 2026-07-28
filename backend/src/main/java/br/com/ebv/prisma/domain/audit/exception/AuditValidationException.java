package br.com.ebv.prisma.domain.audit.exception;

public class AuditValidationException extends RuntimeException {
    public AuditValidationException(String message) {
        super(message);
    }
}
