package br.com.ebv.prisma.domain.thinfile.port.in;

import java.math.BigDecimal;

public interface GetThinfileModelCardUseCase {
    record Result(String modelVersion, String populationDesc, BigDecimal auc,
                  BigDecimal confidenceFloor, boolean active) {}
    Result execute();
}
