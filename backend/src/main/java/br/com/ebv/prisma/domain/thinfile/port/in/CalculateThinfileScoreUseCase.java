package br.com.ebv.prisma.domain.thinfile.port.in;

import java.util.UUID;

public interface CalculateThinfileScoreUseCase {
    record Command(String documento, Integer traditionalHistoryCount) {}
    record Result(UUID scoreId, int scoreValue, String confidenceBand, boolean thinFileFlag,
                  boolean routedToTraditional, String modelVersion) {}
    Result execute(Command command);
}
