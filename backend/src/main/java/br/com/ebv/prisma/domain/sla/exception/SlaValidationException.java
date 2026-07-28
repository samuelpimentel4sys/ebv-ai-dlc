package br.com.ebv.prisma.domain.sla.exception;

public class SlaValidationException extends RuntimeException {
    public SlaValidationException(String message) { super(message); }
}
