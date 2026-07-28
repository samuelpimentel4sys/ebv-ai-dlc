package br.com.ebv.prisma.domain.sla.exception;

public class SlaNotFoundException extends RuntimeException {
    public SlaNotFoundException(String message) { super(message); }
}
