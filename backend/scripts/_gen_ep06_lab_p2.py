# -*- coding: utf-8 -*-
"""EP-06 lab generator part 2: F08, F01, F02, F03."""
from pathlib import Path
import textwrap

ROOT = Path(__file__).resolve().parents[1]
MAIN = ROOT / "src/main/java/br/com/ebv/prisma"
TEST = ROOT / "src/test/java/br/com/ebv/prisma"


def w(path: Path, content: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(textwrap.dedent(content).lstrip("\n"), encoding="utf-8")
    print("W", path.relative_to(ROOT))


# ===================== F08 Utility Link =====================
w(MAIN / "domain/utilitylink/exception/UtilityLinkNotFoundException.java", """
package br.com.ebv.prisma.domain.utilitylink.exception;

public class UtilityLinkNotFoundException extends RuntimeException {
    public UtilityLinkNotFoundException(String message) { super(message); }
}
""")
w(MAIN / "domain/utilitylink/exception/UtilityLinkValidationException.java", """
package br.com.ebv.prisma.domain.utilitylink.exception;

public class UtilityLinkValidationException extends RuntimeException {
    public UtilityLinkValidationException(String message) { super(message); }
}
""")
w(MAIN / "domain/utilitylink/port/out/UtilityLinkRepositoryPort.java", """
package br.com.ebv.prisma.domain.utilitylink.port.out;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UtilityLinkRepositoryPort {
    record LinkRecord(
            UUID linkId, String documentoHash, String partnerCode, String accountRef,
            String utilityType, String status, Instant linkedAt, Instant unlinkedAt
    ) {}

    void save(LinkRecord record);
    Optional<LinkRecord> findById(UUID linkId);
    List<LinkRecord> findByDocumentoHash(String documentoHash);
}
""")
w(MAIN / "domain/utilitylink/port/in/LinkUtilityUseCase.java", """
package br.com.ebv.prisma.domain.utilitylink.port.in;

import java.util.UUID;

public interface LinkUtilityUseCase {
    record Command(String documento, String partnerCode, String accountRef, String utilityType, String holderName) {}
    record Result(UUID linkId, String status, boolean sourceConfirmed, double nameMatchScore) {}
    Result execute(Command command);
}
""")
w(MAIN / "domain/utilitylink/port/in/ListUtilityLinksUseCase.java", """
package br.com.ebv.prisma.domain.utilitylink.port.in;

import java.util.List;
import java.util.UUID;

public interface ListUtilityLinksUseCase {
    record Query(String documento) {}
    record Item(UUID linkId, String partnerCode, String accountRef, String utilityType, String status) {}
    record Result(List<Item> links) {}
    Result execute(Query query);
}
""")
w(MAIN / "domain/utilitylink/port/in/UnlinkUtilityUseCase.java", """
package br.com.ebv.prisma.domain.utilitylink.port.in;

import java.util.UUID;

public interface UnlinkUtilityUseCase {
    record Command(UUID linkId) {}
    record Result(UUID linkId, String status) {}
    Result execute(Command command);
}
""")
w(MAIN / "application/utilitylink/LinkUtilityService.java", """
package br.com.ebv.prisma.application.utilitylink;

import br.com.ebv.prisma.domain.utilitylink.exception.UtilityLinkValidationException;
import br.com.ebv.prisma.domain.utilitylink.port.in.LinkUtilityUseCase;
import br.com.ebv.prisma.domain.utilitylink.port.out.UtilityLinkRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;
import java.util.UUID;

@Service
public class LinkUtilityService implements LinkUtilityUseCase {

    private final UtilityLinkRepositoryPort repo;

    public LinkUtilityService(UtilityLinkRepositoryPort repo) {
        this.repo = repo;
    }

    @Override
    @Transactional
    public Result execute(Command command) {
        if (command.documento() == null || command.documento().isBlank()) {
            throw new UtilityLinkValidationException("documento obrigatório");
        }
        if (command.partnerCode() == null || command.accountRef() == null) {
            throw new UtilityLinkValidationException("partnerCode e accountRef obrigatórios");
        }
        UUID id = UUID.randomUUID();
        String hash = sha256(command.documento().trim());
        // lab stub: always confirms titularidade
        repo.save(new UtilityLinkRepositoryPort.LinkRecord(
                id, hash, command.partnerCode(), command.accountRef(),
                command.utilityType() != null ? command.utilityType() : "ENERGIA",
                "CONFIRMED", Instant.now(), null
        ));
        return new Result(id, "CONFIRMED", true, 0.97);
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
w(MAIN / "application/utilitylink/ListUtilityLinksService.java", """
package br.com.ebv.prisma.application.utilitylink;

import br.com.ebv.prisma.domain.utilitylink.exception.UtilityLinkValidationException;
import br.com.ebv.prisma.domain.utilitylink.port.in.ListUtilityLinksUseCase;
import br.com.ebv.prisma.domain.utilitylink.port.out.UtilityLinkRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ListUtilityLinksService implements ListUtilityLinksUseCase {

    private final UtilityLinkRepositoryPort repo;

    public ListUtilityLinksService(UtilityLinkRepositoryPort repo) {
        this.repo = repo;
    }

    @Override
    @Transactional(readOnly = true)
    public Result execute(Query query) {
        if (query.documento() == null || query.documento().isBlank()) {
            throw new UtilityLinkValidationException("documento obrigatório");
        }
        String hash = LinkUtilityService.sha256(query.documento().trim());
        var links = repo.findByDocumentoHash(hash).stream()
                .map(r -> new Item(r.linkId(), r.partnerCode(), r.accountRef(), r.utilityType(), r.status()))
                .toList();
        return new Result(links);
    }
}
""")
w(MAIN / "application/utilitylink/UnlinkUtilityService.java", """
package br.com.ebv.prisma.application.utilitylink;

import br.com.ebv.prisma.domain.utilitylink.exception.UtilityLinkNotFoundException;
import br.com.ebv.prisma.domain.utilitylink.port.in.UnlinkUtilityUseCase;
import br.com.ebv.prisma.domain.utilitylink.port.out.UtilityLinkRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class UnlinkUtilityService implements UnlinkUtilityUseCase {

    private final UtilityLinkRepositoryPort repo;

    public UnlinkUtilityService(UtilityLinkRepositoryPort repo) {
        this.repo = repo;
    }

    @Override
    @Transactional
    public Result execute(Command command) {
        var existing = repo.findById(command.linkId())
                .orElseThrow(() -> new UtilityLinkNotFoundException("vínculo não encontrado"));
        repo.save(new UtilityLinkRepositoryPort.LinkRecord(
                existing.linkId(), existing.documentoHash(), existing.partnerCode(), existing.accountRef(),
                existing.utilityType(), "UNLINKED", existing.linkedAt(), Instant.now()
        ));
        return new Result(existing.linkId(), "UNLINKED");
    }
}
""")
w(MAIN / "infrastructure/adapter/persistence/utilitylink/UtilityLinkEntity.java", """
package br.com.ebv.prisma.infrastructure.adapter.persistence.utilitylink;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "tb_utility_link")
public class UtilityLinkEntity {
    @Id @Column(name = "link_id") private UUID linkId;
    @Column(name = "documento_hash", nullable = false, length = 64) private String documentoHash;
    @Column(name = "partner_code", nullable = false, length = 40) private String partnerCode;
    @Column(name = "account_ref", nullable = false, length = 80) private String accountRef;
    @Column(name = "utility_type", nullable = false, length = 20) private String utilityType;
    @Column(nullable = false, length = 20) private String status;
    @Column(name = "linked_at", nullable = false) private OffsetDateTime linkedAt;
    @Column(name = "unlinked_at") private OffsetDateTime unlinkedAt;

    public UUID getLinkId() { return linkId; }
    public void setLinkId(UUID linkId) { this.linkId = linkId; }
    public String getDocumentoHash() { return documentoHash; }
    public void setDocumentoHash(String documentoHash) { this.documentoHash = documentoHash; }
    public String getPartnerCode() { return partnerCode; }
    public void setPartnerCode(String partnerCode) { this.partnerCode = partnerCode; }
    public String getAccountRef() { return accountRef; }
    public void setAccountRef(String accountRef) { this.accountRef = accountRef; }
    public String getUtilityType() { return utilityType; }
    public void setUtilityType(String utilityType) { this.utilityType = utilityType; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public OffsetDateTime getLinkedAt() { return linkedAt; }
    public void setLinkedAt(OffsetDateTime linkedAt) { this.linkedAt = linkedAt; }
    public OffsetDateTime getUnlinkedAt() { return unlinkedAt; }
    public void setUnlinkedAt(OffsetDateTime unlinkedAt) { this.unlinkedAt = unlinkedAt; }
}
""")
w(MAIN / "infrastructure/adapter/persistence/utilitylink/UtilityLinkJpaRepository.java", """
package br.com.ebv.prisma.infrastructure.adapter.persistence.utilitylink;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface UtilityLinkJpaRepository extends JpaRepository<UtilityLinkEntity, UUID> {
    List<UtilityLinkEntity> findByDocumentoHashOrderByLinkedAtDesc(String documentoHash);
}
""")
w(MAIN / "infrastructure/adapter/persistence/utilitylink/UtilityLinkRepositoryAdapter.java", """
package br.com.ebv.prisma.infrastructure.adapter.persistence.utilitylink;

import br.com.ebv.prisma.domain.utilitylink.port.out.UtilityLinkRepositoryPort;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
@Transactional
public class UtilityLinkRepositoryAdapter implements UtilityLinkRepositoryPort {

    private final UtilityLinkJpaRepository jpa;

    public UtilityLinkRepositoryAdapter(UtilityLinkJpaRepository jpa) { this.jpa = jpa; }

    @Override
    public void save(LinkRecord record) {
        UtilityLinkEntity e = new UtilityLinkEntity();
        e.setLinkId(record.linkId());
        e.setDocumentoHash(record.documentoHash());
        e.setPartnerCode(record.partnerCode());
        e.setAccountRef(record.accountRef());
        e.setUtilityType(record.utilityType());
        e.setStatus(record.status());
        e.setLinkedAt(OffsetDateTime.ofInstant(record.linkedAt(), ZoneOffset.UTC));
        e.setUnlinkedAt(record.unlinkedAt() == null ? null : OffsetDateTime.ofInstant(record.unlinkedAt(), ZoneOffset.UTC));
        jpa.save(e);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<LinkRecord> findById(UUID linkId) {
        return jpa.findById(linkId).map(this::toRecord);
    }

    @Override
    @Transactional(readOnly = true)
    public List<LinkRecord> findByDocumentoHash(String documentoHash) {
        return jpa.findByDocumentoHashOrderByLinkedAtDesc(documentoHash).stream().map(this::toRecord).toList();
    }

    private LinkRecord toRecord(UtilityLinkEntity e) {
        return new LinkRecord(
                e.getLinkId(), e.getDocumentoHash(), e.getPartnerCode(), e.getAccountRef(),
                e.getUtilityType(), e.getStatus(), e.getLinkedAt().toInstant(),
                e.getUnlinkedAt() == null ? null : e.getUnlinkedAt().toInstant()
        );
    }
}
""")
w(MAIN / "presentation/dto/utilitylink/LinkUtilityRequest.java", """
package br.com.ebv.prisma.presentation.dto.utilitylink;

import jakarta.validation.constraints.NotBlank;

public record LinkUtilityRequest(
        @NotBlank String documento,
        @NotBlank String partnerCode,
        @NotBlank String accountRef,
        String utilityType,
        String holderName
) {}
""")
w(MAIN / "presentation/controller/UtilityLinkController.java", """
package br.com.ebv.prisma.presentation.controller;

import br.com.ebv.prisma.domain.utilitylink.port.in.LinkUtilityUseCase;
import br.com.ebv.prisma.domain.utilitylink.port.in.ListUtilityLinksUseCase;
import br.com.ebv.prisma.domain.utilitylink.port.in.UnlinkUtilityUseCase;
import br.com.ebv.prisma.presentation.dto.utilitylink.LinkUtilityRequest;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/utilities")
@Tag(name = "Utilities", description = "PRISMA-EP-06-F08 Validação de titularidade")
public class UtilityLinkController {

    private final LinkUtilityUseCase link;
    private final ListUtilityLinksUseCase list;
    private final UnlinkUtilityUseCase unlink;

    public UtilityLinkController(LinkUtilityUseCase link, ListUtilityLinksUseCase list, UnlinkUtilityUseCase unlink) {
        this.link = link;
        this.list = list;
        this.unlink = unlink;
    }

    @PostMapping("/link")
    @Operation(summary = "Solicita vínculo e valida titularidade")
    public ResponseEntity<Map<String, Object>> link(@Valid @RequestBody LinkUtilityRequest req) {
        var r = link.execute(new LinkUtilityUseCase.Command(
                req.documento(), req.partnerCode(), req.accountRef(), req.utilityType(), req.holderName()));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("linkId", r.linkId().toString());
        body.put("status", r.status());
        body.put("sourceConfirmed", r.sourceConfirmed());
        body.put("nameMatchScore", r.nameMatchScore());
        return ResponseEntity.status(HttpStatus.CREATED).body(body);
    }

    @GetMapping("/links")
    @Operation(summary = "Lista vínculos do titular")
    public Map<String, Object> links(@RequestParam String documento) {
        var r = list.execute(new ListUtilityLinksUseCase.Query(documento));
        List<Map<String, Object>> links = r.links().stream().map(l -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("linkId", l.linkId().toString());
            m.put("partnerCode", l.partnerCode());
            m.put("accountRef", l.accountRef());
            m.put("utilityType", l.utilityType());
            m.put("status", l.status());
            return m;
        }).toList();
        return Map.of("links", links);
    }

    @DeleteMapping("/links/{linkId}")
    @Operation(summary = "Desvincula conta")
    public Map<String, Object> unlink(@PathVariable UUID linkId) {
        var r = unlink.execute(new UnlinkUtilityUseCase.Command(linkId));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("linkId", r.linkId().toString());
        body.put("status", r.status());
        return body;
    }
}
""")
w(TEST / "application/utilitylink/UtilityLinkServiceTest.java", """
package br.com.ebv.prisma.application.utilitylink;

import br.com.ebv.prisma.domain.utilitylink.port.in.LinkUtilityUseCase;
import br.com.ebv.prisma.domain.utilitylink.port.out.UtilityLinkRepositoryPort;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class UtilityLinkServiceTest {

    @Mock UtilityLinkRepositoryPort repo;

    @Test
    @DisplayName("F08 link confirma titularidade stub")
    void linkOk() {
        var svc = new LinkUtilityService(repo);
        var r = svc.execute(new LinkUtilityUseCase.Command(
                "12345678901", "CEMIG-MG", "UC-998877", "ENERGIA", "Marina Souza"));
        assertThat(r.status()).isEqualTo("CONFIRMED");
        assertThat(r.sourceConfirmed()).isTrue();
        verify(repo).save(any());
    }
}
""")

# ===================== F01 Alt Data =====================
w(MAIN / "domain/altdata/exception/AltDataValidationException.java", """
package br.com.ebv.prisma.domain.altdata.exception;

public class AltDataValidationException extends RuntimeException {
    public AltDataValidationException(String message) { super(message); }
}
""")
w(MAIN / "domain/altdata/port/out/AltDataRepositoryPort.java", """
package br.com.ebv.prisma.domain.altdata.port.out;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface AltDataRepositoryPort {
    record BatchRecord(
            UUID batchId, String partnerCode, String utilityType, String sourceUri,
            Instant receivedAt, int recordCount, BigDecimal errorRate, BigDecimal qualityLimit,
            String status, String rejectionReason, UUID correlationId
    ) {}

    void save(BatchRecord record);
    List<BatchRecord> findRecent(int limit);
}
""")
w(MAIN / "domain/altdata/port/in/IngestAltDataUseCase.java", """
package br.com.ebv.prisma.domain.altdata.port.in;

import java.math.BigDecimal;
import java.util.UUID;

public interface IngestAltDataUseCase {
    record Command(String partnerCode, String utilityType, String sourceUri, int recordCount, BigDecimal errorRate) {}
    record Result(UUID batchId, String status, BigDecimal errorRate, UUID correlationId) {}
    Result execute(Command command);
}
""")
w(MAIN / "domain/altdata/port/in/GetAltCoverageUseCase.java", """
package br.com.ebv.prisma.domain.altdata.port.in;

import java.util.List;

public interface GetAltCoverageUseCase {
    record Item(String partnerCode, String region, long coveredTitulares) {}
    record Result(List<Item> coverage) {}
    Result execute();
}
""")
w(MAIN / "domain/altdata/port/in/GetAltQualityUseCase.java", """
package br.com.ebv.prisma.domain.altdata.port.in;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface GetAltQualityUseCase {
    record Item(UUID batchId, String partnerCode, String status, BigDecimal errorRate) {}
    record Result(List<Item> batches) {}
    Result execute();
}
""")
w(MAIN / "application/altdata/IngestAltDataService.java", """
package br.com.ebv.prisma.application.altdata;

import br.com.ebv.prisma.domain.altdata.exception.AltDataValidationException;
import br.com.ebv.prisma.domain.altdata.port.in.IngestAltDataUseCase;
import br.com.ebv.prisma.domain.altdata.port.out.AltDataRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Service
public class IngestAltDataService implements IngestAltDataUseCase {

    private static final BigDecimal QUALITY_LIMIT = new BigDecimal("0.0500");
    private final AltDataRepositoryPort repo;

    public IngestAltDataService(AltDataRepositoryPort repo) { this.repo = repo; }

    @Override
    @Transactional
    public Result execute(Command command) {
        if (command.partnerCode() == null || command.partnerCode().isBlank()) {
            throw new AltDataValidationException("partnerCode obrigatório");
        }
        BigDecimal err = command.errorRate() != null ? command.errorRate() : BigDecimal.ZERO;
        String status = err.compareTo(QUALITY_LIMIT) > 0 ? "REJECTED" : "ACCEPTED";
        UUID id = UUID.randomUUID();
        UUID corr = UUID.randomUUID();
        repo.save(new AltDataRepositoryPort.BatchRecord(
                id, command.partnerCode(),
                command.utilityType() != null ? command.utilityType() : "ENERGIA",
                command.sourceUri() != null ? command.sourceUri() : "lab://stub",
                Instant.now(), Math.max(command.recordCount(), 0), err, QUALITY_LIMIT,
                status, status.equals("REJECTED") ? "error_rate_above_limit" : null, corr
        ));
        return new Result(id, status, err, corr);
    }
}
""")
w(MAIN / "application/altdata/GetAltCoverageService.java", """
package br.com.ebv.prisma.application.altdata;

import br.com.ebv.prisma.domain.altdata.port.in.GetAltCoverageUseCase;
import br.com.ebv.prisma.domain.altdata.port.out.AltDataRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class GetAltCoverageService implements GetAltCoverageUseCase {

    private final AltDataRepositoryPort repo;

    public GetAltCoverageService(AltDataRepositoryPort repo) { this.repo = repo; }

    @Override
    @Transactional(readOnly = true)
    public Result execute() {
        // lab stub aggregates
        var partners = repo.findRecent(50).stream().map(AltDataRepositoryPort.BatchRecord::partnerCode).distinct().toList();
        if (partners.isEmpty()) {
            return new Result(List.of(new Item("CEMIG-MG", "MG", 12000L)));
        }
        return new Result(partners.stream().map(p -> new Item(p, "BR", 1000L)).toList());
    }
}
""")
w(MAIN / "application/altdata/GetAltQualityService.java", """
package br.com.ebv.prisma.application.altdata;

import br.com.ebv.prisma.domain.altdata.port.in.GetAltQualityUseCase;
import br.com.ebv.prisma.domain.altdata.port.out.AltDataRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GetAltQualityService implements GetAltQualityUseCase {

    private final AltDataRepositoryPort repo;

    public GetAltQualityService(AltDataRepositoryPort repo) { this.repo = repo; }

    @Override
    @Transactional(readOnly = true)
    public Result execute() {
        var items = repo.findRecent(20).stream()
                .map(b -> new Item(b.batchId(), b.partnerCode(), b.status(), b.errorRate()))
                .toList();
        return new Result(items);
    }
}
""")
w(MAIN / "infrastructure/adapter/persistence/altdata/AltDataBatchEntity.java", """
package br.com.ebv.prisma.infrastructure.adapter.persistence.altdata;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "tb_alt_data_batch")
public class AltDataBatchEntity {
    @Id @Column(name = "batch_id") private UUID batchId;
    @Column(name = "partner_code", nullable = false) private String partnerCode;
    @Column(name = "utility_type", nullable = false) private String utilityType;
    @Column(name = "source_uri", nullable = false) private String sourceUri;
    @Column(name = "received_at", nullable = false) private OffsetDateTime receivedAt;
    @Column(name = "record_count", nullable = false) private Integer recordCount;
    @Column(name = "error_rate", nullable = false) private BigDecimal errorRate;
    @Column(name = "quality_limit", nullable = false) private BigDecimal qualityLimit;
    @Column(nullable = false) private String status;
    @Column(name = "rejection_reason") private String rejectionReason;
    @Column(name = "correlation_id", nullable = false) private UUID correlationId;
    @Column(name = "created_at", nullable = false) private OffsetDateTime createdAt;

    public UUID getBatchId() { return batchId; }
    public void setBatchId(UUID batchId) { this.batchId = batchId; }
    public String getPartnerCode() { return partnerCode; }
    public void setPartnerCode(String partnerCode) { this.partnerCode = partnerCode; }
    public String getUtilityType() { return utilityType; }
    public void setUtilityType(String utilityType) { this.utilityType = utilityType; }
    public String getSourceUri() { return sourceUri; }
    public void setSourceUri(String sourceUri) { this.sourceUri = sourceUri; }
    public OffsetDateTime getReceivedAt() { return receivedAt; }
    public void setReceivedAt(OffsetDateTime receivedAt) { this.receivedAt = receivedAt; }
    public Integer getRecordCount() { return recordCount; }
    public void setRecordCount(Integer recordCount) { this.recordCount = recordCount; }
    public BigDecimal getErrorRate() { return errorRate; }
    public void setErrorRate(BigDecimal errorRate) { this.errorRate = errorRate; }
    public BigDecimal getQualityLimit() { return qualityLimit; }
    public void setQualityLimit(BigDecimal qualityLimit) { this.qualityLimit = qualityLimit; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }
    public UUID getCorrelationId() { return correlationId; }
    public void setCorrelationId(UUID correlationId) { this.correlationId = correlationId; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
""")
w(MAIN / "infrastructure/adapter/persistence/altdata/AltDataBatchJpaRepository.java", """
package br.com.ebv.prisma.infrastructure.adapter.persistence.altdata;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AltDataBatchJpaRepository extends JpaRepository<AltDataBatchEntity, UUID> {
    List<AltDataBatchEntity> findTop20ByOrderByReceivedAtDesc();
}
""")
w(MAIN / "infrastructure/adapter/persistence/altdata/AltDataRepositoryAdapter.java", """
package br.com.ebv.prisma.infrastructure.adapter.persistence.altdata;

import br.com.ebv.prisma.domain.altdata.port.out.AltDataRepositoryPort;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;

@Component
@Transactional
public class AltDataRepositoryAdapter implements AltDataRepositoryPort {

    private final AltDataBatchJpaRepository jpa;

    public AltDataRepositoryAdapter(AltDataBatchJpaRepository jpa) { this.jpa = jpa; }

    @Override
    public void save(BatchRecord record) {
        AltDataBatchEntity e = new AltDataBatchEntity();
        e.setBatchId(record.batchId());
        e.setPartnerCode(record.partnerCode());
        e.setUtilityType(record.utilityType());
        e.setSourceUri(record.sourceUri());
        e.setReceivedAt(OffsetDateTime.ofInstant(record.receivedAt(), ZoneOffset.UTC));
        e.setRecordCount(record.recordCount());
        e.setErrorRate(record.errorRate());
        e.setQualityLimit(record.qualityLimit());
        e.setStatus(record.status());
        e.setRejectionReason(record.rejectionReason());
        e.setCorrelationId(record.correlationId());
        e.setCreatedAt(OffsetDateTime.now(ZoneOffset.UTC));
        jpa.save(e);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BatchRecord> findRecent(int limit) {
        return jpa.findTop20ByOrderByReceivedAtDesc().stream().limit(limit).map(e -> new BatchRecord(
                e.getBatchId(), e.getPartnerCode(), e.getUtilityType(), e.getSourceUri(),
                e.getReceivedAt().toInstant(), e.getRecordCount(), e.getErrorRate(), e.getQualityLimit(),
                e.getStatus(), e.getRejectionReason(), e.getCorrelationId()
        )).toList();
    }
}
""")
w(MAIN / "presentation/dto/altdata/IngestAltDataRequest.java", """
package br.com.ebv.prisma.presentation.dto.altdata;

import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;

public record IngestAltDataRequest(
        @NotBlank String partnerCode,
        String utilityType,
        String sourceUri,
        Integer recordCount,
        BigDecimal errorRate
) {}
""")
w(MAIN / "presentation/controller/AltDataController.java", """
package br.com.ebv.prisma.presentation.controller;

import br.com.ebv.prisma.domain.altdata.port.in.GetAltCoverageUseCase;
import br.com.ebv.prisma.domain.altdata.port.in.GetAltQualityUseCase;
import br.com.ebv.prisma.domain.altdata.port.in.IngestAltDataUseCase;
import br.com.ebv.prisma.presentation.dto.altdata.IngestAltDataRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/alternative-data")
@Tag(name = "Alternative Data", description = "PRISMA-EP-06-F01 Ingestão consentida")
public class AltDataController {

    private final IngestAltDataUseCase ingest;
    private final GetAltCoverageUseCase coverage;
    private final GetAltQualityUseCase quality;

    public AltDataController(IngestAltDataUseCase ingest, GetAltCoverageUseCase coverage, GetAltQualityUseCase quality) {
        this.ingest = ingest;
        this.coverage = coverage;
        this.quality = quality;
    }

    @PostMapping("/ingest")
    @Operation(summary = "Recebe lote de utilities")
    public ResponseEntity<Map<String, Object>> ingest(@Valid @RequestBody IngestAltDataRequest req) {
        var r = ingest.execute(new IngestAltDataUseCase.Command(
                req.partnerCode(), req.utilityType(), req.sourceUri(),
                req.recordCount() != null ? req.recordCount() : 0,
                req.errorRate() != null ? req.errorRate() : BigDecimal.ZERO
        ));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("batchId", r.batchId().toString());
        body.put("status", r.status());
        body.put("errorRate", r.errorRate());
        body.put("correlationId", r.correlationId().toString());
        return ResponseEntity.status(HttpStatus.CREATED).body(body);
    }

    @GetMapping("/coverage")
    @Operation(summary = "Cobertura populacional")
    public Map<String, Object> coverage() {
        var r = coverage.execute();
        List<Map<String, Object>> items = r.coverage().stream().map(c -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("partnerCode", c.partnerCode());
            m.put("region", c.region());
            m.put("coveredTitulares", c.coveredTitulares());
            return m;
        }).toList();
        return Map.of("coverage", items);
    }

    @GetMapping("/quality")
    @Operation(summary = "Qualidade dos últimos lotes")
    public Map<String, Object> quality() {
        var r = quality.execute();
        List<Map<String, Object>> items = r.batches().stream().map(b -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("batchId", b.batchId().toString());
            m.put("partnerCode", b.partnerCode());
            m.put("status", b.status());
            m.put("errorRate", b.errorRate());
            return m;
        }).toList();
        return Map.of("batches", items);
    }
}
""")
w(TEST / "application/altdata/AltDataServiceTest.java", """
package br.com.ebv.prisma.application.altdata;

import br.com.ebv.prisma.domain.altdata.port.in.IngestAltDataUseCase;
import br.com.ebv.prisma.domain.altdata.port.out.AltDataRepositoryPort;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class AltDataServiceTest {

    @Mock AltDataRepositoryPort repo;

    @Test
    @DisplayName("F01 ingest ACCEPTED quando errorRate baixo")
    void ingestAccepted() {
        var svc = new IngestAltDataService(repo);
        var r = svc.execute(new IngestAltDataUseCase.Command(
                "CEMIG-MG", "ENERGIA", "s3://lab/batch", 100, new BigDecimal("0.01")));
        assertThat(r.status()).isEqualTo("ACCEPTED");
        verify(repo).save(any());
    }
}
""")

print("F08+F01 done")
