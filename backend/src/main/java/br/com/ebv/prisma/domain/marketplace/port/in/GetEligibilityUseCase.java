package br.com.ebv.prisma.domain.marketplace.port.in;

import java.util.List;

public interface GetEligibilityUseCase {
    record Query(String documento) {}
    record Criterion(String code, boolean met, String detail) {}
    record Result(boolean eligible, List<Criterion> criteria) {}
    Result execute(Query query);
}
