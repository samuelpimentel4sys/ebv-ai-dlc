package br.com.ebv.prisma.domain.audit.exception;

public class AuditNotFoundException extends RuntimeException {
    public AuditNotFoundException(String message) {
        super(message);
    }
}
