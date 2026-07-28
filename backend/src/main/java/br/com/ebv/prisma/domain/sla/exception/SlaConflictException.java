package br.com.ebv.prisma.domain.sla.exception;

public class SlaConflictException extends RuntimeException {
    public SlaConflictException(String message) { super(message); }
}
