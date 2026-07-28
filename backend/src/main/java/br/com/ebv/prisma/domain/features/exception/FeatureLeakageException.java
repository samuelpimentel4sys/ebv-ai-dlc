package br.com.ebv.prisma.domain.features.exception;

public class FeatureLeakageException extends RuntimeException {
    public FeatureLeakageException(String message) {
        super(message);
    }
}
