package br.com.ebv.prisma.domain.thinfile.port.in;

import java.util.UUID;

public interface GetThinfileScoreUseCase {
    record Query(String documento) {}
    record Result(UUID scoreId, int scoreValue, String confidenceBand, String modelVersion, boolean thinFileFlag) {}
    Result execute(Query query);
}
