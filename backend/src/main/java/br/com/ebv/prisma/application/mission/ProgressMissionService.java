package br.com.ebv.prisma.application.mission;

import br.com.ebv.prisma.domain.mission.exception.MissionNotFoundException;
import br.com.ebv.prisma.domain.mission.exception.MissionValidationException;
import br.com.ebv.prisma.domain.mission.port.in.ProgressMissionUseCase;
import br.com.ebv.prisma.domain.mission.port.out.MissionRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Service
public class ProgressMissionService implements ProgressMissionUseCase {

    private final MissionRepositoryPort repo;

    public ProgressMissionService(MissionRepositoryPort repo) { this.repo = repo; }

    @Override
    @Transactional
    public Result execute(Command command) {
        if (command.documento() == null || command.missionId() == null) {
            throw new MissionValidationException("documento e missionId obrigatórios");
        }
        var catalog = repo.findCatalog(command.missionId())
                .orElseThrow(() -> new MissionNotFoundException("missão não encontrada"));
        String hash = ListMissionsService.sha256(command.documento().trim());
        var enrollment = repo.findEnrollment(command.missionId(), hash).orElseGet(() ->
                new MissionRepositoryPort.EnrollmentRecord(
                        UUID.randomUUID(), command.missionId(), hash, "ACTIVE", BigDecimal.ZERO));
        BigDecimal delta = command.deltaPct() != null ? command.deltaPct() : new BigDecimal("25.00");
        BigDecimal progress = enrollment.progressPct().add(delta).min(new BigDecimal("100.00"));
        String status = progress.compareTo(new BigDecimal("100.00")) >= 0 ? "COMPLETED" : "ACTIVE";
        var updated = new MissionRepositoryPort.EnrollmentRecord(
                enrollment.enrollmentId(), enrollment.missionId(), hash, status, progress);
        repo.saveEnrollment(updated);
        boolean earned = false;
        if ("COMPLETED".equals(status)) {
            repo.saveAchievement(new MissionRepositoryPort.AchievementRecord(
                    UUID.randomUUID(), hash, catalog.missionId(), catalog.code(), catalog.title(), Instant.now()));
            earned = true;
        }
        return new Result(updated.enrollmentId(), progress, status, earned);
    }
}
