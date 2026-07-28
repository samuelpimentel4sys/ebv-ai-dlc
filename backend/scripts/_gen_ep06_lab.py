# -*- coding: utf-8 -*-
"""Generate EP-06 lab skeleton (Flyway + hexagonal stubs). One-shot script."""
from pathlib import Path
import textwrap

ROOT = Path(__file__).resolve().parents[1]
MAIN = ROOT / "src/main/java/br/com/ebv/prisma"
TEST = ROOT / "src/test/java/br/com/ebv/prisma"
MIG = ROOT / "src/main/resources/db/migration"


def w(path: Path, content: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(textwrap.dedent(content).lstrip("\n"), encoding="utf-8")
    print("W", path.relative_to(ROOT))


# ---------- Flyway ----------
w(MIG / "V31__consent_f04.sql", """
-- EP-06 F04 — Consentimento granular (lab)
CREATE TABLE IF NOT EXISTS tb_consent (
    consent_id UUID PRIMARY KEY,
    documento_hash VARCHAR(64) NOT NULL,
    purpose_code VARCHAR(40) NOT NULL,
    source_code VARCHAR(40) NOT NULL,
    status VARCHAR(20) NOT NULL,
    granted_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    valid_to TIMESTAMPTZ,
    channel VARCHAR(30) NOT NULL,
    version_termo VARCHAR(20) NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_consent_doc_status ON tb_consent (documento_hash, status);
""")

w(MIG / "V32__ownership_f08.sql", """
-- EP-06 F08 — Validação titularidade utilities (lab)
CREATE TABLE IF NOT EXISTS tb_utility_link (
    link_id UUID PRIMARY KEY,
    documento_hash VARCHAR(64) NOT NULL,
    partner_code VARCHAR(40) NOT NULL,
    account_ref VARCHAR(80) NOT NULL,
    utility_type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    linked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    unlinked_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS ix_util_link_doc ON tb_utility_link (documento_hash, status);
""")

w(MIG / "V33__alt_ingest_f01.sql", """
-- EP-06 F01 — Ingestão dados alternativos (lab)
CREATE TABLE IF NOT EXISTS tb_alt_data_batch (
    batch_id UUID PRIMARY KEY,
    partner_code VARCHAR(40) NOT NULL,
    utility_type VARCHAR(20) NOT NULL,
    source_uri TEXT NOT NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    record_count INTEGER NOT NULL,
    error_rate NUMERIC(7,4) NOT NULL,
    quality_limit NUMERIC(7,4) NOT NULL,
    status VARCHAR(20) NOT NULL,
    rejection_reason TEXT,
    correlation_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_alt_batch_partner ON tb_alt_data_batch (partner_code, received_at DESC);
""")

w(MIG / "V34__thinfile_score_f02.sql", """
-- EP-06 F02 — Score thin-file (lab)
CREATE TABLE IF NOT EXISTS tb_thinfile_model_card (
    model_version VARCHAR(40) PRIMARY KEY,
    trained_at TIMESTAMPTZ NOT NULL,
    validated_at TIMESTAMPTZ NOT NULL,
    population_desc TEXT NOT NULL,
    auc NUMERIC(6,4),
    confidence_floor NUMERIC(6,4) NOT NULL,
    limitations_json TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS tb_thinfile_score (
    score_id UUID PRIMARY KEY,
    documento_hash VARCHAR(64) NOT NULL,
    model_version VARCHAR(40) NOT NULL,
    score_value INTEGER NOT NULL,
    confidence_band VARCHAR(20) NOT NULL,
    thin_file_flag BOOLEAN NOT NULL DEFAULT TRUE,
    routed_to_traditional BOOLEAN NOT NULL DEFAULT FALSE,
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    correlation_id UUID NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_tf_score_doc ON tb_thinfile_score (documento_hash, calculated_at DESC);

INSERT INTO tb_thinfile_model_card (model_version, trained_at, validated_at, population_desc, auc, confidence_floor, limitations_json, active)
VALUES ('tf-lab-1.0', NOW(), NOW(), 'thin-file lab population', 0.7200, 0.5500, '{"note":"lab stub"}', TRUE);
""")

w(MIG / "V35__coach_f03.sql", """
-- EP-06 F03 — Coach journey (lab)
CREATE TABLE IF NOT EXISTS tb_coach_journey (
    journey_id UUID PRIMARY KEY,
    documento_hash VARCHAR(64) NOT NULL,
    status VARCHAR(20) NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    decision_snapshot_id UUID,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tb_coach_goal (
    goal_id UUID PRIMARY KEY,
    journey_id UUID NOT NULL,
    goal_type VARCHAR(40) NOT NULL,
    title VARCHAR(200) NOT NULL,
    estimate_text VARCHAR(500) NOT NULL,
    guarantees_approval BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
""")

w(MIG / "V36__gamification_f05.sql", """
-- EP-06 F05 — Gamificação / missões (lab)
CREATE TABLE IF NOT EXISTS tb_mission_catalog (
    mission_id UUID PRIMARY KEY,
    code VARCHAR(40) NOT NULL UNIQUE,
    title VARCHAR(200) NOT NULL,
    rules_json TEXT NOT NULL,
    reward_type VARCHAR(30) NOT NULL DEFAULT 'SYMBOLIC',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    version INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tb_mission_enrollment (
    enrollment_id UUID PRIMARY KEY,
    mission_id UUID NOT NULL,
    documento_hash VARCHAR(64) NOT NULL,
    status VARCHAR(20) NOT NULL,
    progress_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tb_mission_achievement (
    achievement_id UUID PRIMARY KEY,
    documento_hash VARCHAR(64) NOT NULL,
    mission_id UUID NOT NULL,
    code VARCHAR(40) NOT NULL,
    title VARCHAR(200) NOT NULL,
    earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO tb_mission_catalog (mission_id, code, title, rules_json, reward_type, active, version, updated_at)
VALUES ('e0000000-0000-4000-8000-000000000001', 'PAY_ON_TIME_3M', 'Pague em dia 3 meses', '{"events":["UTILITY_PAYMENT_ON_TIME"],"target":3}', 'SYMBOLIC', TRUE, 1, NOW());
""")

w(MIG / "V37__action_effect_f06.sql", """
-- EP-06 F06 — Efeito estimado de ação (lab)
CREATE TABLE IF NOT EXISTS tb_coach_simulation (
    simulation_id UUID PRIMARY KEY,
    documento_hash VARCHAR(64) NOT NULL,
    snapshot_score_id UUID NOT NULL,
    action_code VARCHAR(40) NOT NULL,
    estimable BOOLEAN NOT NULL,
    score_delta_min INTEGER,
    score_delta_max INTEGER,
    effect_days_min INTEGER,
    effect_days_max INTEGER,
    message VARCHAR(500) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_sim_doc ON tb_coach_simulation (documento_hash, created_at DESC);
""")

w(MIG / "V38__eligibility_f07.sql", """
-- EP-06 F07 — Marketplace elegibilidade (lab)
CREATE TABLE IF NOT EXISTS tb_mkt_partner (
    partner_id UUID PRIMARY KEY,
    code VARCHAR(40) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    eligibility_json TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS tb_mkt_offer (
    offer_id UUID PRIMARY KEY,
    partner_id UUID NOT NULL,
    title VARCHAR(200) NOT NULL,
    product_type VARCHAR(40) NOT NULL,
    explanation_template VARCHAR(500) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS tb_mkt_referral (
    referral_id UUID PRIMARY KEY,
    offer_id UUID NOT NULL,
    documento_hash VARCHAR(64) NOT NULL,
    consent_id UUID NOT NULL,
    status VARCHAR(20) NOT NULL,
    partner_ref VARCHAR(80),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO tb_mkt_partner (partner_id, code, name, eligibility_json, active)
VALUES ('f0000000-0000-4000-8000-000000000001', 'BANK-LAB', 'Banco Lab', '{"minScore":400}', TRUE);
INSERT INTO tb_mkt_offer (offer_id, partner_id, title, product_type, explanation_template, active)
VALUES ('f0000000-0000-4000-8000-000000000002', 'f0000000-0000-4000-8000-000000000001', 'Conta Inclusão', 'CHECKING', 'Elegível por score thin-file {score}', TRUE);
""")

w(MIG / "V39__drift_f09.sql", """
-- EP-06 F09 — Monitoramento thin-file / drift (lab)
CREATE TABLE IF NOT EXISTS tb_tf_monitoring_run (
    run_id UUID PRIMARY KEY,
    model_version VARCHAR(40) NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL,
    auc_current NUMERIC(6,4),
    auc_baseline NUMERIC(6,4),
    degradation_pct NUMERIC(7,4)
);

CREATE TABLE IF NOT EXISTS tb_tf_drift_metric (
    metric_id UUID PRIMARY KEY,
    run_id UUID NOT NULL,
    feature_name VARCHAR(80) NOT NULL,
    psi NUMERIC(8,4) NOT NULL,
    vulnerable_segment BOOLEAN NOT NULL DEFAULT FALSE,
    severity VARCHAR(20) NOT NULL
);
""")


def write_feature_stack(
    pkg: str,
    *,
    exceptions: list[str],
    ports_in: dict[str, str],
    port_out: str,
    services: dict[str, str],
    entity: str,
    jpa: str,
    adapter: str,
    controller: str,
    dtos: dict[str, str] | None = None,
    test: str | None = None,
):
    base_d = MAIN / "domain" / pkg
    base_a = MAIN / "application" / pkg
    base_i = MAIN / "infrastructure/adapter/persistence" / pkg
    base_p = MAIN / "presentation"

    for name, body in exceptions:
        w(base_d / "exception" / f"{name}.java", body)

    for name, body in ports_in.items():
        w(base_d / "port/in" / f"{name}.java", body)

    w(base_d / "port/out" / f"{pkg[0].upper()+pkg[1:]}RepositoryPort.java".replace(
        "UtilitylinkRepositoryPort", "UtilityLinkRepositoryPort"
    ) if False else base_d / "port/out" / _repo_port_name(pkg), port_out)

    for name, body in services.items():
        w(base_a / f"{name}.java", body)

    w(base_i / _entity_name(pkg), entity)
    w(base_i / _jpa_name(pkg), jpa)
    w(base_i / _adapter_name(pkg), adapter)
    w(base_p / "controller" / f"{_controller_file(pkg)}", controller)

    if dtos:
        for name, body in dtos.items():
            w(base_p / "dto" / pkg / f"{name}.java", body)

    if test:
        w(TEST / "application" / pkg / f"{_test_name(pkg)}", test)


def _repo_port_name(pkg: str) -> str:
    mapping = {
        "consent": "ConsentRepositoryPort.java",
        "utilitylink": "UtilityLinkRepositoryPort.java",
        "altdata": "AltDataRepositoryPort.java",
        "thinfile": "ThinfileRepositoryPort.java",
        "coach": "CoachRepositoryPort.java",
        "mission": "MissionRepositoryPort.java",
        "marketplace": "MarketplaceRepositoryPort.java",
    }
    return mapping[pkg]


def _entity_name(pkg: str) -> str:
    mapping = {
        "consent": "ConsentEntity.java",
        "utilitylink": "UtilityLinkEntity.java",
        "altdata": "AltDataBatchEntity.java",
        "thinfile": "ThinfileScoreEntity.java",
        "coach": "CoachJourneyEntity.java",
        "mission": "MissionEnrollmentEntity.java",
        "marketplace": "MktReferralEntity.java",
    }
    return mapping[pkg]


def _jpa_name(pkg: str) -> str:
    return _entity_name(pkg).replace("Entity.java", "JpaRepository.java")


def _adapter_name(pkg: str) -> str:
    mapping = {
        "consent": "ConsentRepositoryAdapter.java",
        "utilitylink": "UtilityLinkRepositoryAdapter.java",
        "altdata": "AltDataRepositoryAdapter.java",
        "thinfile": "ThinfileRepositoryAdapter.java",
        "coach": "CoachRepositoryAdapter.java",
        "mission": "MissionRepositoryAdapter.java",
        "marketplace": "MarketplaceRepositoryAdapter.java",
    }
    return mapping[pkg]


def _controller_file(pkg: str) -> str:
    mapping = {
        "consent": "ConsentController.java",
        "utilitylink": "UtilityLinkController.java",
        "altdata": "AltDataController.java",
        "thinfile": "ThinfileController.java",
        "coach": "CoachController.java",
        "mission": "MissionController.java",
        "marketplace": "MarketplaceController.java",
    }
    return mapping[pkg]


def _test_name(pkg: str) -> str:
    mapping = {
        "consent": "ConsentServiceTest.java",
        "utilitylink": "UtilityLinkServiceTest.java",
        "altdata": "AltDataServiceTest.java",
        "thinfile": "ThinfileServiceTest.java",
        "coach": "CoachServiceTest.java",
        "mission": "MissionServiceTest.java",
        "marketplace": "MarketplaceServiceTest.java",
    }
    return mapping[pkg]


# ===================== F04 CONSENT =====================
w(MAIN / "domain/consent/exception/ConsentNotFoundException.java", """
package br.com.ebv.prisma.domain.consent.exception;

public class ConsentNotFoundException extends RuntimeException {
    public ConsentNotFoundException(String message) { super(message); }
}
""")
w(MAIN / "domain/consent/exception/ConsentValidationException.java", """
package br.com.ebv.prisma.domain.consent.exception;

public class ConsentValidationException extends RuntimeException {
    public ConsentValidationException(String message) { super(message); }
}
""")
w(MAIN / "domain/consent/port/out/ConsentRepositoryPort.java", """
package br.com.ebv.prisma.domain.consent.port.out;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ConsentRepositoryPort {

    record ConsentRecord(
            UUID consentId,
            String documentoHash,
            String purposeCode,
            String sourceCode,
            String status,
            Instant grantedAt,
            Instant revokedAt,
            Instant validTo,
            String channel,
            String versionTermo
    ) {}

    void save(ConsentRecord record);

    Optional<ConsentRecord> findById(UUID consentId);

    List<ConsentRecord> findByDocumentoHash(String documentoHash);
}
""")
w(MAIN / "domain/consent/port/in/RegisterConsentUseCase.java", """
package br.com.ebv.prisma.domain.consent.port.in;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface RegisterConsentUseCase {
    record Item(String purposeCode, String sourceCode, boolean accepted, Instant validTo) {}
    record Command(String documento, List<Item> items, String channel, String versionTermo) {}
    record ResultItem(UUID consentId, String purposeCode, String sourceCode, String status) {}
    record Result(String documentoHash, List<ResultItem> items) {}

    Result execute(Command command);
}
""")
w(MAIN / "domain/consent/port/in/ListConsentsUseCase.java", """
package br.com.ebv.prisma.domain.consent.port.in;

import java.util.List;
import java.util.UUID;

public interface ListConsentsUseCase {
    record Query(String documento) {}
    record Item(UUID consentId, String purposeCode, String sourceCode, String status) {}
    record Result(String documento, List<Item> consents) {}

    Result execute(Query query);
}
""")
w(MAIN / "domain/consent/port/in/RevokeConsentUseCase.java", """
package br.com.ebv.prisma.domain.consent.port.in;

import java.util.UUID;

public interface RevokeConsentUseCase {
    record Command(UUID consentId) {}
    record Result(UUID consentId, String status) {}

    Result execute(Command command);
}
""")
w(MAIN / "application/consent/RegisterConsentService.java", """
package br.com.ebv.prisma.application.consent;

import br.com.ebv.prisma.domain.consent.exception.ConsentValidationException;
import br.com.ebv.prisma.domain.consent.port.in.RegisterConsentUseCase;
import br.com.ebv.prisma.domain.consent.port.out.ConsentRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

@Service
public class RegisterConsentService implements RegisterConsentUseCase {

    private final ConsentRepositoryPort repo;

    public RegisterConsentService(ConsentRepositoryPort repo) {
        this.repo = repo;
    }

    @Override
    @Transactional
    public Result execute(Command command) {
        if (command.documento() == null || command.documento().isBlank()) {
            throw new ConsentValidationException("documento obrigatório");
        }
        if (command.items() == null || command.items().isEmpty()) {
            throw new ConsentValidationException("items obrigatório");
        }
        String hash = sha256(command.documento().trim());
        Instant now = Instant.now();
        List<ResultItem> out = new ArrayList<>();
        for (Item item : command.items()) {
            if (!item.accepted()) {
                out.add(new ResultItem(null, item.purposeCode(), item.sourceCode(), "DECLINED"));
                continue;
            }
            UUID id = UUID.randomUUID();
            repo.save(new ConsentRepositoryPort.ConsentRecord(
                    id, hash, item.purposeCode(), item.sourceCode(), "ACTIVE",
                    now, null, item.validTo(),
                    command.channel() != null ? command.channel() : "MOBILE_APP",
                    command.versionTermo() != null ? command.versionTermo() : "v1.0"
            ));
            out.add(new ResultItem(id, item.purposeCode(), item.sourceCode(), "ACTIVE"));
        }
        return new Result(hash, out);
    }

    static String sha256(String value) {
        try {
            byte[] dig = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(dig);
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
""")
w(MAIN / "application/consent/ListConsentsService.java", """
package br.com.ebv.prisma.application.consent;

import br.com.ebv.prisma.domain.consent.exception.ConsentValidationException;
import br.com.ebv.prisma.domain.consent.port.in.ListConsentsUseCase;
import br.com.ebv.prisma.domain.consent.port.out.ConsentRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ListConsentsService implements ListConsentsUseCase {

    private final ConsentRepositoryPort repo;

    public ListConsentsService(ConsentRepositoryPort repo) {
        this.repo = repo;
    }

    @Override
    @Transactional(readOnly = true)
    public Result execute(Query query) {
        if (query.documento() == null || query.documento().isBlank()) {
            throw new ConsentValidationException("documento obrigatório");
        }
        String hash = RegisterConsentService.sha256(query.documento().trim());
        var items = repo.findByDocumentoHash(hash).stream()
                .map(r -> new Item(r.consentId(), r.purposeCode(), r.sourceCode(), r.status()))
                .toList();
        return new Result(query.documento(), items);
    }
}
""")
w(MAIN / "application/consent/RevokeConsentService.java", """
package br.com.ebv.prisma.application.consent;

import br.com.ebv.prisma.domain.consent.exception.ConsentNotFoundException;
import br.com.ebv.prisma.domain.consent.port.in.RevokeConsentUseCase;
import br.com.ebv.prisma.domain.consent.port.out.ConsentRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class RevokeConsentService implements RevokeConsentUseCase {

    private final ConsentRepositoryPort repo;

    public RevokeConsentService(ConsentRepositoryPort repo) {
        this.repo = repo;
    }

    @Override
    @Transactional
    public Result execute(Command command) {
        var existing = repo.findById(command.consentId())
                .orElseThrow(() -> new ConsentNotFoundException("consentimento não encontrado"));
        repo.save(new ConsentRepositoryPort.ConsentRecord(
                existing.consentId(), existing.documentoHash(), existing.purposeCode(), existing.sourceCode(),
                "REVOKED", existing.grantedAt(), Instant.now(), existing.validTo(),
                existing.channel(), existing.versionTermo()
        ));
        return new Result(existing.consentId(), "REVOKED");
    }
}
""")
w(MAIN / "infrastructure/adapter/persistence/consent/ConsentEntity.java", """
package br.com.ebv.prisma.infrastructure.adapter.persistence.consent;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "tb_consent")
public class ConsentEntity {
    @Id
    @Column(name = "consent_id")
    private UUID consentId;
    @Column(name = "documento_hash", nullable = false, length = 64)
    private String documentoHash;
    @Column(name = "purpose_code", nullable = false, length = 40)
    private String purposeCode;
    @Column(name = "source_code", nullable = false, length = 40)
    private String sourceCode;
    @Column(nullable = false, length = 20)
    private String status;
    @Column(name = "granted_at", nullable = false)
    private OffsetDateTime grantedAt;
    @Column(name = "revoked_at")
    private OffsetDateTime revokedAt;
    @Column(name = "valid_to")
    private OffsetDateTime validTo;
    @Column(nullable = false, length = 30)
    private String channel;
    @Column(name = "version_termo", nullable = false, length = 20)
    private String versionTermo;

    public UUID getConsentId() { return consentId; }
    public void setConsentId(UUID consentId) { this.consentId = consentId; }
    public String getDocumentoHash() { return documentoHash; }
    public void setDocumentoHash(String documentoHash) { this.documentoHash = documentoHash; }
    public String getPurposeCode() { return purposeCode; }
    public void setPurposeCode(String purposeCode) { this.purposeCode = purposeCode; }
    public String getSourceCode() { return sourceCode; }
    public void setSourceCode(String sourceCode) { this.sourceCode = sourceCode; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public OffsetDateTime getGrantedAt() { return grantedAt; }
    public void setGrantedAt(OffsetDateTime grantedAt) { this.grantedAt = grantedAt; }
    public OffsetDateTime getRevokedAt() { return revokedAt; }
    public void setRevokedAt(OffsetDateTime revokedAt) { this.revokedAt = revokedAt; }
    public OffsetDateTime getValidTo() { return validTo; }
    public void setValidTo(OffsetDateTime validTo) { this.validTo = validTo; }
    public String getChannel() { return channel; }
    public void setChannel(String channel) { this.channel = channel; }
    public String getVersionTermo() { return versionTermo; }
    public void setVersionTermo(String versionTermo) { this.versionTermo = versionTermo; }
}
""")
w(MAIN / "infrastructure/adapter/persistence/consent/ConsentJpaRepository.java", """
package br.com.ebv.prisma.infrastructure.adapter.persistence.consent;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ConsentJpaRepository extends JpaRepository<ConsentEntity, UUID> {
    List<ConsentEntity> findByDocumentoHashOrderByGrantedAtDesc(String documentoHash);
}
""")
w(MAIN / "infrastructure/adapter/persistence/consent/ConsentRepositoryAdapter.java", """
package br.com.ebv.prisma.infrastructure.adapter.persistence.consent;

import br.com.ebv.prisma.domain.consent.port.out.ConsentRepositoryPort;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
@Transactional
public class ConsentRepositoryAdapter implements ConsentRepositoryPort {

    private final ConsentJpaRepository jpa;

    public ConsentRepositoryAdapter(ConsentJpaRepository jpa) {
        this.jpa = jpa;
    }

    @Override
    public void save(ConsentRecord record) {
        ConsentEntity e = new ConsentEntity();
        e.setConsentId(record.consentId());
        e.setDocumentoHash(record.documentoHash());
        e.setPurposeCode(record.purposeCode());
        e.setSourceCode(record.sourceCode());
        e.setStatus(record.status());
        e.setGrantedAt(OffsetDateTime.ofInstant(record.grantedAt(), ZoneOffset.UTC));
        e.setRevokedAt(record.revokedAt() == null ? null : OffsetDateTime.ofInstant(record.revokedAt(), ZoneOffset.UTC));
        e.setValidTo(record.validTo() == null ? null : OffsetDateTime.ofInstant(record.validTo(), ZoneOffset.UTC));
        e.setChannel(record.channel());
        e.setVersionTermo(record.versionTermo());
        jpa.save(e);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<ConsentRecord> findById(UUID consentId) {
        return jpa.findById(consentId).map(this::toRecord);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ConsentRecord> findByDocumentoHash(String documentoHash) {
        return jpa.findByDocumentoHashOrderByGrantedAtDesc(documentoHash).stream().map(this::toRecord).toList();
    }

    private ConsentRecord toRecord(ConsentEntity e) {
        return new ConsentRecord(
                e.getConsentId(), e.getDocumentoHash(), e.getPurposeCode(), e.getSourceCode(), e.getStatus(),
                e.getGrantedAt().toInstant(),
                e.getRevokedAt() == null ? null : e.getRevokedAt().toInstant(),
                e.getValidTo() == null ? null : e.getValidTo().toInstant(),
                e.getChannel(), e.getVersionTermo()
        );
    }
}
""")
w(MAIN / "presentation/dto/consent/RegisterConsentRequest.java", """
package br.com.ebv.prisma.presentation.dto.consent;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.time.Instant;
import java.util.List;

public record RegisterConsentRequest(
        @NotBlank String documento,
        @NotEmpty List<Item> items,
        String channel,
        String versionTermo
) {
    public record Item(String purposeCode, String sourceCode, Boolean accepted, Instant validTo) {}
}
""")
w(MAIN / "presentation/controller/ConsentController.java", """
package br.com.ebv.prisma.presentation.controller;

import br.com.ebv.prisma.domain.consent.port.in.ListConsentsUseCase;
import br.com.ebv.prisma.domain.consent.port.in.RegisterConsentUseCase;
import br.com.ebv.prisma.domain.consent.port.in.RevokeConsentUseCase;
import br.com.ebv.prisma.presentation.dto.consent.RegisterConsentRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/consents")
@Tag(name = "Consent", description = "PRISMA-EP-06-F04 Ciclo de vida do consentimento")
public class ConsentController {

    private final RegisterConsentUseCase register;
    private final ListConsentsUseCase list;
    private final RevokeConsentUseCase revoke;

    public ConsentController(RegisterConsentUseCase register, ListConsentsUseCase list, RevokeConsentUseCase revoke) {
        this.register = register;
        this.list = list;
        this.revoke = revoke;
    }

    @PostMapping
    @Operation(summary = "Registra consentimento granular")
    public ResponseEntity<Map<String, Object>> register(@Valid @RequestBody RegisterConsentRequest req) {
        var items = req.items().stream()
                .map(i -> new RegisterConsentUseCase.Item(
                        i.purposeCode(), i.sourceCode(), Boolean.TRUE.equals(i.accepted()), i.validTo()))
                .toList();
        var r = register.execute(new RegisterConsentUseCase.Command(req.documento(), items, req.channel(), req.versionTermo()));
        List<Map<String, Object>> out = r.items().stream().map(it -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("consentId", it.consentId() == null ? null : it.consentId().toString());
            m.put("purposeCode", it.purposeCode());
            m.put("sourceCode", it.sourceCode());
            m.put("status", it.status());
            return m;
        }).toList();
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("documentoHash", r.documentoHash());
        body.put("items", out);
        return ResponseEntity.status(HttpStatus.CREATED).body(body);
    }

    @GetMapping("/{documento}")
    @Operation(summary = "Lista consentimentos do titular")
    public Map<String, Object> list(@PathVariable String documento) {
        var r = list.execute(new ListConsentsUseCase.Query(documento));
        List<Map<String, Object>> consents = r.consents().stream().map(c -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("consentId", c.consentId().toString());
            m.put("purposeCode", c.purposeCode());
            m.put("sourceCode", c.sourceCode());
            m.put("status", c.status());
            return m;
        }).toList();
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("documento", r.documento());
        body.put("consents", consents);
        return body;
    }

    @DeleteMapping("/{consentId}")
    @Operation(summary = "Revoga consentimento")
    public Map<String, Object> revoke(@PathVariable UUID consentId) {
        var r = revoke.execute(new RevokeConsentUseCase.Command(consentId));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("consentId", r.consentId().toString());
        body.put("status", r.status());
        return body;
    }
}
""")
w(TEST / "application/consent/ConsentServiceTest.java", """
package br.com.ebv.prisma.application.consent;

import br.com.ebv.prisma.domain.consent.port.in.RegisterConsentUseCase;
import br.com.ebv.prisma.domain.consent.port.in.RevokeConsentUseCase;
import br.com.ebv.prisma.domain.consent.port.out.ConsentRepositoryPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ConsentServiceTest {

    @Mock ConsentRepositoryPort repo;
    RegisterConsentService register;
    RevokeConsentService revoke;

    @BeforeEach
    void setUp() {
        register = new RegisterConsentService(repo);
        revoke = new RevokeConsentService(repo);
    }

    @Test
    @DisplayName("F04 registra consentimento ACTIVE e revoga")
    void registerAndRevoke() {
        var result = register.execute(new RegisterConsentUseCase.Command(
                "12345678901",
                List.of(new RegisterConsentUseCase.Item("UTILITIES_SCORE", "CEMIG-MG", true, Instant.parse("2027-07-27T00:00:00Z"))),
                "MOBILE_APP", "v3.2"
        ));
        assertThat(result.items()).hasSize(1);
        assertThat(result.items().get(0).status()).isEqualTo("ACTIVE");

        ArgumentCaptor<ConsentRepositoryPort.ConsentRecord> cap =
                ArgumentCaptor.forClass(ConsentRepositoryPort.ConsentRecord.class);
        verify(repo).save(cap.capture());
        UUID id = cap.getValue().consentId();
        when(repo.findById(id)).thenReturn(Optional.of(cap.getValue()));

        var revoked = revoke.execute(new RevokeConsentUseCase.Command(id));
        assertThat(revoked.status()).isEqualTo("REVOKED");
    }
}
""")

print("F04 done")
print("migrations+consent partial ok — continue in part 2")
