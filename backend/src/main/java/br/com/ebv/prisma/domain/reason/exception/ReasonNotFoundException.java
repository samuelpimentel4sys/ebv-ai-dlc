package br.com.ebv.prisma.domain.reason.exception;

public class ReasonNotFoundException extends RuntimeException {
    public ReasonNotFoundException(String message) {
        super(message);
    }
}
