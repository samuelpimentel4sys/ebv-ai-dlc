package br.com.ebv.prisma.domain.features.exception;

public class AmbiguousIdentityException extends RuntimeException {
    public AmbiguousIdentityException(String documento) {
        super("Identidade ambígua para documento=" + documento);
    }
}
