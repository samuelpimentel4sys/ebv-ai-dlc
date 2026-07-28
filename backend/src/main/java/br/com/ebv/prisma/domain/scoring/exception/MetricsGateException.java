package br.com.ebv.prisma.domain.scoring.exception;

public class MetricsGateException extends RuntimeException {
    public MetricsGateException(String modelId, String version) {
        super("Métricas canary não aprovadas para promoção a PRODUCTION: " + modelId + " v" + version);
    }
}
