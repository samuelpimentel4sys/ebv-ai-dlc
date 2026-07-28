package br.com.ebv.prisma.domain.mission.port.in;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface ListMissionsUseCase {
    record Query(String documento) {}
    record Item(UUID missionId, String code, String title, String status, BigDecimal progressPct) {}
    record Result(List<Item> missions) {}
    Result execute(Query query);
}
