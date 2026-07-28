package br.com.ebv.prisma.infrastructure.adapter.persistence.mission;

import br.com.ebv.prisma.domain.mission.port.out.MissionRepositoryPort;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
@Transactional
public class MissionRepositoryAdapter implements MissionRepositoryPort {

    private final MissionCatalogJpaRepository catalogJpa;
    private final MissionEnrollmentJpaRepository enrollmentJpa;
    private final MissionAchievementJpaRepository achievementJpa;

    public MissionRepositoryAdapter(
            MissionCatalogJpaRepository catalogJpa,
            MissionEnrollmentJpaRepository enrollmentJpa,
            MissionAchievementJpaRepository achievementJpa
    ) {
        this.catalogJpa = catalogJpa;
        this.enrollmentJpa = enrollmentJpa;
        this.achievementJpa = achievementJpa;
    }

    @Override
    @Transactional(readOnly = true)
    public List<CatalogRecord> findActiveCatalog() {
        return catalogJpa.findByActiveTrue().stream()
                .map(e -> new CatalogRecord(e.getMissionId(), e.getCode(), e.getTitle(), e.getRulesJson(), e.getActive()))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<CatalogRecord> findCatalog(UUID missionId) {
        return catalogJpa.findById(missionId)
                .map(e -> new CatalogRecord(e.getMissionId(), e.getCode(), e.getTitle(), e.getRulesJson(), e.getActive()));
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<EnrollmentRecord> findEnrollment(UUID missionId, String documentoHash) {
        return enrollmentJpa.findByMissionIdAndDocumentoHash(missionId, documentoHash)
                .map(e -> new EnrollmentRecord(e.getEnrollmentId(), e.getMissionId(), e.getDocumentoHash(),
                        e.getStatus(), e.getProgressPct()));
    }

    @Override
    public void saveEnrollment(EnrollmentRecord record) {
        MissionEnrollmentEntity e = new MissionEnrollmentEntity();
        e.setEnrollmentId(record.enrollmentId());
        e.setMissionId(record.missionId());
        e.setDocumentoHash(record.documentoHash());
        e.setStatus(record.status());
        e.setProgressPct(record.progressPct());
        e.setEnrolledAt(OffsetDateTime.now(ZoneOffset.UTC));
        enrollmentJpa.save(e);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AchievementRecord> findAchievements(String documentoHash) {
        return achievementJpa.findByDocumentoHashOrderByEarnedAtDesc(documentoHash).stream()
                .map(e -> new AchievementRecord(e.getAchievementId(), e.getDocumentoHash(), e.getMissionId(),
                        e.getCode(), e.getTitle(), e.getEarnedAt().toInstant()))
                .toList();
    }

    @Override
    public void saveAchievement(AchievementRecord record) {
        MissionAchievementEntity e = new MissionAchievementEntity();
        e.setAchievementId(record.achievementId());
        e.setDocumentoHash(record.documentoHash());
        e.setMissionId(record.missionId());
        e.setCode(record.code());
        e.setTitle(record.title());
        e.setEarnedAt(OffsetDateTime.ofInstant(record.earnedAt(), ZoneOffset.UTC));
        achievementJpa.save(e);
    }
}
