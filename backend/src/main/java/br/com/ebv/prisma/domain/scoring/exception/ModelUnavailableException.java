package br.com.ebv.prisma.domain.scoring.exception;

public class ModelUnavailableException extends RuntimeException {
    public ModelUnavailableException(String modelId) {
        super("Nenhum modelo PRODUCTION disponível para: " + modelId);
    }
}
