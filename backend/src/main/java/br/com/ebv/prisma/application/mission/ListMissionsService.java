package br.com.ebv.prisma.application.mission;

import br.com.ebv.prisma.domain.mission.exception.MissionValidationException;
import br.com.ebv.prisma.domain.mission.port.in.ListMissionsUseCase;
import br.com.ebv.prisma.domain.mission.port.out.MissionRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;

@Service
public class ListMissionsService implements ListMissionsUseCase {

    private final MissionRepositoryPort repo;

    public ListMissionsService(MissionRepositoryPort repo) { this.repo = repo; }

    @Override
    @Transactional(readOnly = true)
    public Result execute(Query query) {
        if (query.documento() == null || query.documento().isBlank()) {
            throw new MissionValidationException("documento obrigatório");
        }
        String hash = sha256(query.documento().trim());
        var items = repo.findActiveCatalog().stream().map(c -> {
            var enr = repo.findEnrollment(c.missionId(), hash);
            return new Item(
                    c.missionId(), c.code(), c.title(),
                    enr.map(MissionRepositoryPort.EnrollmentRecord::status).orElse("AVAILABLE"),
                    enr.map(MissionRepositoryPort.EnrollmentRecord::progressPct).orElse(BigDecimal.ZERO)
            );
        }).toList();
        return new Result(items);
    }

    static String sha256(String value) {
        try {
            return HexFormat.of().formatHex(
                    MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
