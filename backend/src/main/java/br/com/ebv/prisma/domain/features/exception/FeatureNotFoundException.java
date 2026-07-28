package br.com.ebv.prisma.domain.features.exception;

public class FeatureNotFoundException extends RuntimeException {
    public FeatureNotFoundException(String name) {
        super("Feature inexistente: " + name);
    }
}
