package br.com.ebv.prisma.domain.scoring.exception;

public class ModelImmutableException extends RuntimeException {
    public ModelImmutableException(String modelId, String version) {
        super("Versão imutável — não pode ser sobrescrita: " + modelId + " v" + version);
    }
}
