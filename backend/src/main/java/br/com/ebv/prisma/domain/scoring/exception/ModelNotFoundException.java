package br.com.ebv.prisma.domain.scoring.exception;

public class ModelNotFoundException extends RuntimeException {
    public ModelNotFoundException(String modelId, String version) {
        super("Model não encontrado: " + modelId + " v" + version);
    }
}
