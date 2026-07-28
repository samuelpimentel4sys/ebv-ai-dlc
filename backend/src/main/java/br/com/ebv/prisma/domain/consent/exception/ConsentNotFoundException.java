package br.com.ebv.prisma.domain.consent.exception;

public class ConsentNotFoundException extends RuntimeException {
    public ConsentNotFoundException(String message) { super(message); }
}
