# -*- coding: utf-8 -*-
"""EP-06 lab generator part 5: F05 missions + F07 marketplace."""
from pathlib import Path
import textwrap

ROOT = Path(__file__).resolve().parents[1]
MAIN = ROOT / "src/main/java/br/com/ebv/prisma"
TEST = ROOT / "src/test/java/br/com/ebv/prisma"


def w(path: Path, content: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(textwrap.dedent(content).lstrip("\n"), encoding="utf-8")
    print("W", path.relative_to(ROOT))


# ===================== F05 Mission =====================
w(MAIN / "domain/mission/exception/MissionNotFoundException.java", """
package br.com.ebv.prisma.domain.mission.exception;

public class MissionNotFoundException extends RuntimeException {
    public MissionNotFoundException(String message) { super(message); }
}
""")
w(MAIN / "domain/mission/exception/MissionValidationException.java", """
package br.com.ebv.prisma.domain.mission.exception;

public class MissionValidationException extends RuntimeException {
    public MissionValidationException(String message) { super(message); }
}
""")
w(MAIN / "domain/mission/port/out/MissionRepositoryPort.java", """
package br.com.ebv.prisma.domain.mission.port.out;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MissionRepositoryPort {
    record CatalogRecord(UUID missionId, String code, String title, String rulesJson, boolean active) {}
    record EnrollmentRecord(UUID enrollmentId, UUID missionId, String documentoHash, String status, BigDecimal progressPct) {}
    record AchievementRecord(UUID achievementId, String documentoHash, UUID missionId, String code, String title, Instant earnedAt) {}

    List<CatalogRecord> findActiveCatalog();
    Optional<CatalogRecord> findCatalog(UUID missionId);
    Optional<EnrollmentRecord> findEnrollment(UUID missionId, String documentoHash);
    void saveEnrollment(EnrollmentRecord record);
    List<AchievementRecord> findAchievements(String documentoHash);
    void saveAchievement(AchievementRecord record);
}
""")
w(MAIN / "domain/mission/port/in/ListMissionsUseCase.java", """
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
""")
w(MAIN / "domain/mission/port/in/ProgressMissionUseCase.java", """
package br.com.ebv.prisma.domain.mission.port.in;

import java.math.BigDecimal;
import java.util.UUID;

public interface ProgressMissionUseCase {
    record Command(UUID missionId, String documento, String verifiedEventType, UUID verifiedEventId, BigDecimal deltaPct) {}
    record Result(UUID enrollmentId, BigDecimal progressPct, String status, boolean achievementEarned) {}
    Result execute(Command command);
}
""")
w(MAIN / "domain/mission/port/in/ListAchievementsUseCase.java", """
package br.com.ebv.prisma.domain.mission.port.in;

import java.util.List;
import java.util.UUID;

public interface ListAchievementsUseCase {
    record Query(String documento) {}
    record Item(UUID achievementId, String code, String title) {}
    record Result(List<Item> achievements) {}
    Result execute(Query query);
}
""")
w(MAIN / "application/mission/ListMissionsService.java", """
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
""")
w(MAIN / "application/mission/ProgressMissionService.java", """
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
""")
w(MAIN / "application/mission/ListAchievementsService.java", """
package br.com.ebv.prisma.application.mission;

import br.com.ebv.prisma.domain.mission.exception.MissionValidationException;
import br.com.ebv.prisma.domain.mission.port.in.ListAchievementsUseCase;
import br.com.ebv.prisma.domain.mission.port.out.MissionRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ListAchievementsService implements ListAchievementsUseCase {

    private final MissionRepositoryPort repo;

    public ListAchievementsService(MissionRepositoryPort repo) { this.repo = repo; }

    @Override
    @Transactional(readOnly = true)
    public Result execute(Query query) {
        if (query.documento() == null || query.documento().isBlank()) {
            throw new MissionValidationException("documento obrigatório");
        }
        var items = repo.findAchievements(ListMissionsService.sha256(query.documento().trim())).stream()
                .map(a -> new Item(a.achievementId(), a.code(), a.title()))
                .toList();
        return new Result(items);
    }
}
""")
w(MAIN / "infrastructure/adapter/persistence/mission/MissionCatalogEntity.java", """
package br.com.ebv.prisma.infrastructure.adapter.persistence.mission;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "tb_mission_catalog")
public class MissionCatalogEntity {
    @Id @Column(name = "mission_id") private UUID missionId;
    @Column(nullable = false, unique = true) private String code;
    @Column(nullable = false) private String title;
    @Column(name = "rules_json", nullable = false) private String rulesJson;
    @Column(name = "reward_type", nullable = false) private String rewardType;
    @Column(nullable = false) private Boolean active;
    @Column(nullable = false) private Integer version;
    @Column(name = "updated_at", nullable = false) private OffsetDateTime updatedAt;

    public UUID getMissionId() { return missionId; }
    public void setMissionId(UUID missionId) { this.missionId = missionId; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getRulesJson() { return rulesJson; }
    public void setRulesJson(String rulesJson) { this.rulesJson = rulesJson; }
    public String getRewardType() { return rewardType; }
    public void setRewardType(String rewardType) { this.rewardType = rewardType; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
    public Integer getVersion() { return version; }
    public void setVersion(Integer version) { this.version = version; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
""")
w(MAIN / "infrastructure/adapter/persistence/mission/MissionEnrollmentEntity.java", """
package br.com.ebv.prisma.infrastructure.adapter.persistence.mission;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "tb_mission_enrollment")
public class MissionEnrollmentEntity {
    @Id @Column(name = "enrollment_id") private UUID enrollmentId;
    @Column(name = "mission_id", nullable = false) private UUID missionId;
    @Column(name = "documento_hash", nullable = false) private String documentoHash;
    @Column(nullable = false) private String status;
    @Column(name = "progress_pct", nullable = false) private BigDecimal progressPct;
    @Column(name = "enrolled_at", nullable = false) private OffsetDateTime enrolledAt;

    public UUID getEnrollmentId() { return enrollmentId; }
    public void setEnrollmentId(UUID enrollmentId) { this.enrollmentId = enrollmentId; }
    public UUID getMissionId() { return missionId; }
    public void setMissionId(UUID missionId) { this.missionId = missionId; }
    public String getDocumentoHash() { return documentoHash; }
    public void setDocumentoHash(String documentoHash) { this.documentoHash = documentoHash; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public BigDecimal getProgressPct() { return progressPct; }
    public void setProgressPct(BigDecimal progressPct) { this.progressPct = progressPct; }
    public OffsetDateTime getEnrolledAt() { return enrolledAt; }
    public void setEnrolledAt(OffsetDateTime enrolledAt) { this.enrolledAt = enrolledAt; }
}
""")
w(MAIN / "infrastructure/adapter/persistence/mission/MissionAchievementEntity.java", """
package br.com.ebv.prisma.infrastructure.adapter.persistence.mission;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "tb_mission_achievement")
public class MissionAchievementEntity {
    @Id @Column(name = "achievement_id") private UUID achievementId;
    @Column(name = "documento_hash", nullable = false) private String documentoHash;
    @Column(name = "mission_id", nullable = false) private UUID missionId;
    @Column(nullable = false) private String code;
    @Column(nullable = false) private String title;
    @Column(name = "earned_at", nullable = false) private OffsetDateTime earnedAt;

    public UUID getAchievementId() { return achievementId; }
    public void setAchievementId(UUID achievementId) { this.achievementId = achievementId; }
    public String getDocumentoHash() { return documentoHash; }
    public void setDocumentoHash(String documentoHash) { this.documentoHash = documentoHash; }
    public UUID getMissionId() { return missionId; }
    public void setMissionId(UUID missionId) { this.missionId = missionId; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public OffsetDateTime getEarnedAt() { return earnedAt; }
    public void setEarnedAt(OffsetDateTime earnedAt) { this.earnedAt = earnedAt; }
}
""")
w(MAIN / "infrastructure/adapter/persistence/mission/MissionCatalogJpaRepository.java", """
package br.com.ebv.prisma.infrastructure.adapter.persistence.mission;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MissionCatalogJpaRepository extends JpaRepository<MissionCatalogEntity, UUID> {
    List<MissionCatalogEntity> findByActiveTrue();
}
""")
w(MAIN / "infrastructure/adapter/persistence/mission/MissionEnrollmentJpaRepository.java", """
package br.com.ebv.prisma.infrastructure.adapter.persistence.mission;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface MissionEnrollmentJpaRepository extends JpaRepository<MissionEnrollmentEntity, UUID> {
    Optional<MissionEnrollmentEntity> findByMissionIdAndDocumentoHash(UUID missionId, String documentoHash);
}
""")
w(MAIN / "infrastructure/adapter/persistence/mission/MissionAchievementJpaRepository.java", """
package br.com.ebv.prisma.infrastructure.adapter.persistence.mission;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MissionAchievementJpaRepository extends JpaRepository<MissionAchievementEntity, UUID> {
    List<MissionAchievementEntity> findByDocumentoHashOrderByEarnedAtDesc(String documentoHash);
}
""")
w(MAIN / "infrastructure/adapter/persistence/mission/MissionRepositoryAdapter.java", """
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
""")
w(MAIN / "presentation/dto/mission/ProgressMissionRequest.java", """
package br.com.ebv.prisma.presentation.dto.mission;

import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;
import java.util.UUID;

public record ProgressMissionRequest(
        @NotBlank String documento,
        String verifiedEventType,
        UUID verifiedEventId,
        BigDecimal deltaPct
) {}
""")
w(MAIN / "presentation/controller/MissionController.java", """
package br.com.ebv.prisma.presentation.controller;

import br.com.ebv.prisma.domain.mission.port.in.ListAchievementsUseCase;
import br.com.ebv.prisma.domain.mission.port.in.ListMissionsUseCase;
import br.com.ebv.prisma.domain.mission.port.in.ProgressMissionUseCase;
import br.com.ebv.prisma.presentation.dto.mission.ProgressMissionRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/missions")
@Tag(name = "Missions", description = "PRISMA-EP-06-F05 Gamificação")
public class MissionController {

    private final ListMissionsUseCase list;
    private final ProgressMissionUseCase progress;
    private final ListAchievementsUseCase achievements;

    public MissionController(ListMissionsUseCase list, ProgressMissionUseCase progress, ListAchievementsUseCase achievements) {
        this.list = list;
        this.progress = progress;
        this.achievements = achievements;
    }

    @GetMapping
    @Operation(summary = "Lista missões elegíveis")
    public Map<String, Object> list(@RequestParam String documento) {
        var r = list.execute(new ListMissionsUseCase.Query(documento));
        List<Map<String, Object>> missions = r.missions().stream().map(m -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("missionId", m.missionId().toString());
            row.put("code", m.code());
            row.put("title", m.title());
            row.put("status", m.status());
            row.put("progressPct", m.progressPct());
            return row;
        }).toList();
        return Map.of("missions", missions);
    }

    @PostMapping("/{id}/progress")
    @Operation(summary = "Apura progresso de missão")
    public Map<String, Object> progress(@PathVariable("id") UUID id, @Valid @RequestBody ProgressMissionRequest req) {
        var r = progress.execute(new ProgressMissionUseCase.Command(
                id, req.documento(), req.verifiedEventType(), req.verifiedEventId(), req.deltaPct()));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("enrollmentId", r.enrollmentId().toString());
        body.put("progressPct", r.progressPct());
        body.put("status", r.status());
        body.put("achievementEarned", r.achievementEarned());
        return body;
    }

    @GetMapping("/achievements")
    @Operation(summary = "Conquistas simbólicas")
    public Map<String, Object> achievements(@RequestParam String documento) {
        var r = achievements.execute(new ListAchievementsUseCase.Query(documento));
        List<Map<String, Object>> items = r.achievements().stream().map(a -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("achievementId", a.achievementId().toString());
            m.put("code", a.code());
            m.put("title", a.title());
            return m;
        }).toList();
        return Map.of("achievements", items);
    }
}
""")
w(TEST / "application/mission/MissionServiceTest.java", """
package br.com.ebv.prisma.application.mission;

import br.com.ebv.prisma.domain.mission.port.in.ProgressMissionUseCase;
import br.com.ebv.prisma.domain.mission.port.out.MissionRepositoryPort;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MissionServiceTest {

    @Mock MissionRepositoryPort repo;

    @Test
    @DisplayName("F05 progress completa missão e gera achievement")
    void progressCompletes() {
        UUID mid = UUID.fromString("e0000000-0000-4000-8000-000000000001");
        when(repo.findCatalog(mid)).thenReturn(Optional.of(
                new MissionRepositoryPort.CatalogRecord(mid, "PAY_ON_TIME_3M", "Pague em dia 3 meses", "{}", true)));
        when(repo.findEnrollment(any(), any())).thenReturn(Optional.of(
                new MissionRepositoryPort.EnrollmentRecord(UUID.randomUUID(), mid, "hash", "ACTIVE", new BigDecimal("80.00"))));
        var svc = new ProgressMissionService(repo);
        var r = svc.execute(new ProgressMissionUseCase.Command(
                mid, "12345678901", "UTILITY_PAYMENT_ON_TIME", UUID.randomUUID(), new BigDecimal("25.00")));
        assertThat(r.status()).isEqualTo("COMPLETED");
        assertThat(r.achievementEarned()).isTrue();
        verify(repo).saveAchievement(any());
    }
}
""")

# ===================== F07 Marketplace =====================
w(MAIN / "domain/marketplace/exception/MarketplaceNotFoundException.java", """
package br.com.ebv.prisma.domain.marketplace.exception;

public class MarketplaceNotFoundException extends RuntimeException {
    public MarketplaceNotFoundException(String message) { super(message); }
}
""")
w(MAIN / "domain/marketplace/exception/MarketplaceValidationException.java", """
package br.com.ebv.prisma.domain.marketplace.exception;

public class MarketplaceValidationException extends RuntimeException {
    public MarketplaceValidationException(String message) { super(message); }
}
""")
w(MAIN / "domain/marketplace/port/out/MarketplaceRepositoryPort.java", """
package br.com.ebv.prisma.domain.marketplace.port.out;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MarketplaceRepositoryPort {
    record OfferRecord(UUID offerId, UUID partnerId, String partnerCode, String title, String productType,
                       String explanationTemplate, boolean active) {}
    record ReferralRecord(UUID referralId, UUID offerId, String documentoHash, UUID consentId,
                          String status, String partnerRef, Instant createdAt) {}

    List<OfferRecord> findActiveOffers();
    Optional<OfferRecord> findOffer(UUID offerId);
    void saveReferral(ReferralRecord record);
}
""")
w(MAIN / "domain/marketplace/port/in/ListOffersUseCase.java", """
package br.com.ebv.prisma.domain.marketplace.port.in;

import java.util.List;
import java.util.UUID;

public interface ListOffersUseCase {
    record Query(String documento) {}
    record Item(UUID offerId, String partnerCode, String title, String productType, String explanation) {}
    record Result(List<Item> offers) {}
    Result execute(Query query);
}
""")
w(MAIN / "domain/marketplace/port/in/ApplyOfferUseCase.java", """
package br.com.ebv.prisma.domain.marketplace.port.in;

import java.util.UUID;

public interface ApplyOfferUseCase {
    record Command(UUID offerId, String documento, UUID consentId) {}
    record Result(UUID referralId, String status, String partnerRef) {}
    Result execute(Command command);
}
""")
w(MAIN / "domain/marketplace/port/in/GetEligibilityUseCase.java", """
package br.com.ebv.prisma.domain.marketplace.port.in;

import java.util.List;

public interface GetEligibilityUseCase {
    record Query(String documento) {}
    record Criterion(String code, boolean met, String detail) {}
    record Result(boolean eligible, List<Criterion> criteria) {}
    Result execute(Query query);
}
""")
w(MAIN / "application/marketplace/ListOffersService.java", """
package br.com.ebv.prisma.application.marketplace;

import br.com.ebv.prisma.domain.marketplace.exception.MarketplaceValidationException;
import br.com.ebv.prisma.domain.marketplace.port.in.ListOffersUseCase;
import br.com.ebv.prisma.domain.marketplace.port.out.MarketplaceRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ListOffersService implements ListOffersUseCase {

    private final MarketplaceRepositoryPort repo;

    public ListOffersService(MarketplaceRepositoryPort repo) { this.repo = repo; }

    @Override
    @Transactional(readOnly = true)
    public Result execute(Query query) {
        if (query.documento() == null || query.documento().isBlank()) {
            throw new MarketplaceValidationException("documento obrigatório");
        }
        // lab: all active offers considered eligible
        var items = repo.findActiveOffers().stream()
                .map(o -> new Item(o.offerId(), o.partnerCode(), o.title(), o.productType(),
                        o.explanationTemplate().replace("{score}", "520")))
                .toList();
        return new Result(items);
    }
}
""")
w(MAIN / "application/marketplace/ApplyOfferService.java", """
package br.com.ebv.prisma.application.marketplace;

import br.com.ebv.prisma.domain.marketplace.exception.MarketplaceNotFoundException;
import br.com.ebv.prisma.domain.marketplace.exception.MarketplaceValidationException;
import br.com.ebv.prisma.domain.marketplace.port.in.ApplyOfferUseCase;
import br.com.ebv.prisma.domain.marketplace.port.out.MarketplaceRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;
import java.util.UUID;

@Service
public class ApplyOfferService implements ApplyOfferUseCase {

    private final MarketplaceRepositoryPort repo;

    public ApplyOfferService(MarketplaceRepositoryPort repo) { this.repo = repo; }

    @Override
    @Transactional
    public Result execute(Command command) {
        if (command.documento() == null || command.consentId() == null) {
            throw new MarketplaceValidationException("documento e consentId obrigatórios");
        }
        var offer = repo.findOffer(command.offerId())
                .orElseThrow(() -> new MarketplaceNotFoundException("oferta não encontrada"));
        UUID referralId = UUID.randomUUID();
        String partnerRef = "LAB-" + referralId.toString().substring(0, 8);
        repo.saveReferral(new MarketplaceRepositoryPort.ReferralRecord(
                referralId, offer.offerId(), sha256(command.documento().trim()),
                command.consentId(), "SENT", partnerRef, Instant.now()
        ));
        return new Result(referralId, "SENT", partnerRef);
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
""")
w(MAIN / "application/marketplace/GetEligibilityService.java", """
package br.com.ebv.prisma.application.marketplace;

import br.com.ebv.prisma.domain.marketplace.exception.MarketplaceValidationException;
import br.com.ebv.prisma.domain.marketplace.port.in.GetEligibilityUseCase;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class GetEligibilityService implements GetEligibilityUseCase {

    @Override
    public Result execute(Query query) {
        if (query.documento() == null || query.documento().isBlank()) {
            throw new MarketplaceValidationException("documento obrigatório");
        }
        return new Result(true, List.of(
                new Criterion("MIN_SCORE", true, "score thin-file >= 400"),
                new Criterion("CONSENT_MARKETPLACE", true, "consent lab stub")
        ));
    }
}
""")
w(MAIN / "infrastructure/adapter/persistence/marketplace/MktOfferEntity.java", """
package br.com.ebv.prisma.infrastructure.adapter.persistence.marketplace;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.util.UUID;

@Entity
@Table(name = "tb_mkt_offer")
public class MktOfferEntity {
    @Id @Column(name = "offer_id") private UUID offerId;
    @Column(name = "partner_id", nullable = false) private UUID partnerId;
    @Column(nullable = false) private String title;
    @Column(name = "product_type", nullable = false) private String productType;
    @Column(name = "explanation_template", nullable = false) private String explanationTemplate;
    @Column(nullable = false) private Boolean active;

    public UUID getOfferId() { return offerId; }
    public void setOfferId(UUID offerId) { this.offerId = offerId; }
    public UUID getPartnerId() { return partnerId; }
    public void setPartnerId(UUID partnerId) { this.partnerId = partnerId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getProductType() { return productType; }
    public void setProductType(String productType) { this.productType = productType; }
    public String getExplanationTemplate() { return explanationTemplate; }
    public void setExplanationTemplate(String explanationTemplate) { this.explanationTemplate = explanationTemplate; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
}
""")
w(MAIN / "infrastructure/adapter/persistence/marketplace/MktPartnerEntity.java", """
package br.com.ebv.prisma.infrastructure.adapter.persistence.marketplace;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.util.UUID;

@Entity
@Table(name = "tb_mkt_partner")
public class MktPartnerEntity {
    @Id @Column(name = "partner_id") private UUID partnerId;
    @Column(nullable = false, unique = true) private String code;
    @Column(nullable = false) private String name;
    @Column(name = "eligibility_json", nullable = false) private String eligibilityJson;
    @Column(nullable = false) private Boolean active;

    public UUID getPartnerId() { return partnerId; }
    public void setPartnerId(UUID partnerId) { this.partnerId = partnerId; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEligibilityJson() { return eligibilityJson; }
    public void setEligibilityJson(String eligibilityJson) { this.eligibilityJson = eligibilityJson; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
}
""")
w(MAIN / "infrastructure/adapter/persistence/marketplace/MktReferralEntity.java", """
package br.com.ebv.prisma.infrastructure.adapter.persistence.marketplace;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "tb_mkt_referral")
public class MktReferralEntity {
    @Id @Column(name = "referral_id") private UUID referralId;
    @Column(name = "offer_id", nullable = false) private UUID offerId;
    @Column(name = "documento_hash", nullable = false) private String documentoHash;
    @Column(name = "consent_id", nullable = false) private UUID consentId;
    @Column(nullable = false) private String status;
    @Column(name = "partner_ref") private String partnerRef;
    @Column(name = "created_at", nullable = false) private OffsetDateTime createdAt;

    public UUID getReferralId() { return referralId; }
    public void setReferralId(UUID referralId) { this.referralId = referralId; }
    public UUID getOfferId() { return offerId; }
    public void setOfferId(UUID offerId) { this.offerId = offerId; }
    public String getDocumentoHash() { return documentoHash; }
    public void setDocumentoHash(String documentoHash) { this.documentoHash = documentoHash; }
    public UUID getConsentId() { return consentId; }
    public void setConsentId(UUID consentId) { this.consentId = consentId; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getPartnerRef() { return partnerRef; }
    public void setPartnerRef(String partnerRef) { this.partnerRef = partnerRef; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
""")
w(MAIN / "infrastructure/adapter/persistence/marketplace/MktOfferJpaRepository.java", """
package br.com.ebv.prisma.infrastructure.adapter.persistence.marketplace;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MktOfferJpaRepository extends JpaRepository<MktOfferEntity, UUID> {
    List<MktOfferEntity> findByActiveTrue();
}
""")
w(MAIN / "infrastructure/adapter/persistence/marketplace/MktPartnerJpaRepository.java", """
package br.com.ebv.prisma.infrastructure.adapter.persistence.marketplace;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface MktPartnerJpaRepository extends JpaRepository<MktPartnerEntity, UUID> {}
""")
w(MAIN / "infrastructure/adapter/persistence/marketplace/MktReferralJpaRepository.java", """
package br.com.ebv.prisma.infrastructure.adapter.persistence.marketplace;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface MktReferralJpaRepository extends JpaRepository<MktReferralEntity, UUID> {}
""")
w(MAIN / "infrastructure/adapter/persistence/marketplace/MarketplaceRepositoryAdapter.java", """
package br.com.ebv.prisma.infrastructure.adapter.persistence.marketplace;

import br.com.ebv.prisma.domain.marketplace.port.out.MarketplaceRepositoryPort;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
@Transactional
public class MarketplaceRepositoryAdapter implements MarketplaceRepositoryPort {

    private final MktOfferJpaRepository offerJpa;
    private final MktPartnerJpaRepository partnerJpa;
    private final MktReferralJpaRepository referralJpa;

    public MarketplaceRepositoryAdapter(
            MktOfferJpaRepository offerJpa,
            MktPartnerJpaRepository partnerJpa,
            MktReferralJpaRepository referralJpa
    ) {
        this.offerJpa = offerJpa;
        this.partnerJpa = partnerJpa;
        this.referralJpa = referralJpa;
    }

    @Override
    @Transactional(readOnly = true)
    public List<OfferRecord> findActiveOffers() {
        return offerJpa.findByActiveTrue().stream().map(this::toOffer).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<OfferRecord> findOffer(UUID offerId) {
        return offerJpa.findById(offerId).map(this::toOffer);
    }

    @Override
    public void saveReferral(ReferralRecord record) {
        MktReferralEntity e = new MktReferralEntity();
        e.setReferralId(record.referralId());
        e.setOfferId(record.offerId());
        e.setDocumentoHash(record.documentoHash());
        e.setConsentId(record.consentId());
        e.setStatus(record.status());
        e.setPartnerRef(record.partnerRef());
        e.setCreatedAt(OffsetDateTime.ofInstant(record.createdAt(), ZoneOffset.UTC));
        referralJpa.save(e);
    }

    private OfferRecord toOffer(MktOfferEntity e) {
        String partnerCode = partnerJpa.findById(e.getPartnerId()).map(MktPartnerEntity::getCode).orElse("UNKNOWN");
        return new OfferRecord(e.getOfferId(), e.getPartnerId(), partnerCode, e.getTitle(),
                e.getProductType(), e.getExplanationTemplate(), Boolean.TRUE.equals(e.getActive()));
    }
}
""")
w(MAIN / "presentation/dto/marketplace/ApplyOfferRequest.java", """
package br.com.ebv.prisma.presentation.dto.marketplace;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record ApplyOfferRequest(
        @NotBlank String documento,
        @NotNull UUID consentId
) {}
""")
w(MAIN / "presentation/controller/MarketplaceController.java", """
package br.com.ebv.prisma.presentation.controller;

import br.com.ebv.prisma.domain.marketplace.port.in.ApplyOfferUseCase;
import br.com.ebv.prisma.domain.marketplace.port.in.GetEligibilityUseCase;
import br.com.ebv.prisma.domain.marketplace.port.in.ListOffersUseCase;
import br.com.ebv.prisma.presentation.dto.marketplace.ApplyOfferRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/marketplace")
@Tag(name = "Marketplace", description = "PRISMA-EP-06-F07 Elegibilidade e encaminhamento")
public class MarketplaceController {

    private final ListOffersUseCase listOffers;
    private final ApplyOfferUseCase apply;
    private final GetEligibilityUseCase eligibility;

    public MarketplaceController(ListOffersUseCase listOffers, ApplyOfferUseCase apply, GetEligibilityUseCase eligibility) {
        this.listOffers = listOffers;
        this.apply = apply;
        this.eligibility = eligibility;
    }

    @GetMapping("/offers")
    @Operation(summary = "Vitrine filtrada por elegibilidade")
    public Map<String, Object> offers(@RequestParam String documento) {
        var r = listOffers.execute(new ListOffersUseCase.Query(documento));
        List<Map<String, Object>> offers = r.offers().stream().map(o -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("offerId", o.offerId().toString());
            m.put("partnerCode", o.partnerCode());
            m.put("title", o.title());
            m.put("productType", o.productType());
            m.put("explanation", o.explanation());
            return m;
        }).toList();
        return Map.of("offers", offers);
    }

    @PostMapping("/offers/{id}/apply")
    @Operation(summary = "Encaminha lead com consentimento")
    public ResponseEntity<Map<String, Object>> apply(@PathVariable("id") UUID id, @Valid @RequestBody ApplyOfferRequest req) {
        var r = apply.execute(new ApplyOfferUseCase.Command(id, req.documento(), req.consentId()));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("referralId", r.referralId().toString());
        body.put("status", r.status());
        body.put("partnerRef", r.partnerRef());
        return ResponseEntity.status(HttpStatus.CREATED).body(body);
    }

    @GetMapping("/eligibility")
    @Operation(summary = "Critérios e elegibilidade do titular")
    public Map<String, Object> eligibility(@RequestParam String documento) {
        var r = eligibility.execute(new GetEligibilityUseCase.Query(documento));
        List<Map<String, Object>> criteria = r.criteria().stream().map(c -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("code", c.code());
            m.put("met", c.met());
            m.put("detail", c.detail());
            return m;
        }).toList();
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("eligible", r.eligible());
        body.put("criteria", criteria);
        return body;
    }
}
""")
w(TEST / "application/marketplace/MarketplaceServiceTest.java", """
package br.com.ebv.prisma.application.marketplace;

import br.com.ebv.prisma.domain.marketplace.port.in.ApplyOfferUseCase;
import br.com.ebv.prisma.domain.marketplace.port.out.MarketplaceRepositoryPort;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MarketplaceServiceTest {

    @Mock MarketplaceRepositoryPort repo;

    @Test
    @DisplayName("F07 apply cria referral SENT")
    void applyOk() {
        UUID offerId = UUID.fromString("f0000000-0000-4000-8000-000000000002");
        when(repo.findOffer(offerId)).thenReturn(Optional.of(new MarketplaceRepositoryPort.OfferRecord(
                offerId, UUID.randomUUID(), "BANK-LAB", "Conta Inclusão", "CHECKING", "tpl", true)));
        var svc = new ApplyOfferService(repo);
        var r = svc.execute(new ApplyOfferUseCase.Command(offerId, "12345678901", UUID.randomUUID()));
        assertThat(r.status()).isEqualTo("SENT");
        verify(repo).saveReferral(any());
    }
}
""")

print("F05+F07 done")
