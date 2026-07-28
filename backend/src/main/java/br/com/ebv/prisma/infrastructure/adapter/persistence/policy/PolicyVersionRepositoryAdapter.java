package br.com.ebv.prisma.infrastructure.adapter.persistence.policy;

import br.com.ebv.prisma.domain.policy.port.out.PolicyVersionRepositoryPort;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
@Transactional
public class PolicyVersionRepositoryAdapter implements PolicyVersionRepositoryPort {

    private final PolicyVersionJpaRepository jpa;

    public PolicyVersionRepositoryAdapter(PolicyVersionJpaRepository jpa) {
        this.jpa = jpa;
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<PolicyVersionRecord> findById(UUID id) {
        return jpa.findById(id).map(this::toRecord);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResult search(String status, String author, java.time.Instant from, java.time.Instant to, int page, int size) {
        OffsetDateTime fromTs = from == null ? null : OffsetDateTime.ofInstant(from, ZoneOffset.UTC);
        OffsetDateTime toTs = to == null ? null : OffsetDateTime.ofInstant(to, ZoneOffset.UTC);
        List<PolicyVersionEntity> all = jpa.search(
                blankToNull(status),
                blankToNull(author),
                fromTs,
                toTs
        );
        long total = all.size();
        int fromIdx = Math.min(page * size, all.size());
        int toIdx = Math.min(fromIdx + size, all.size());
        List<PolicyVersionRecord> items = all.subList(fromIdx, toIdx).stream().map(this::toRecord).toList();
        int totalPages = size == 0 ? 0 : (int) Math.ceil((double) total / size);
        return new PageResult(items, page, size, total, totalPages);
    }

    @Override
    public void save(PolicyVersionRecord record) {
        PolicyVersionEntity e = new PolicyVersionEntity();
        e.setId(record.id());
        e.setVersion(record.version());
        e.setStatus(record.status());
        e.setArtifactJson(record.artifactJson());
        e.setArtifactHash(record.artifactHash());
        e.setAuthor(record.author());
        e.setApprovalId(record.approvalId());
        e.setEffectiveAt(record.effectiveAt() == null ? null : OffsetDateTime.ofInstant(record.effectiveAt(), ZoneOffset.UTC));
        e.setReleaseNote(record.releaseNote());
        e.setGitCommit(record.gitCommit());
        e.setCreatedAt(OffsetDateTime.ofInstant(record.createdAt(), ZoneOffset.UTC));
        e.setPublishedAt(record.publishedAt() == null ? null : OffsetDateTime.ofInstant(record.publishedAt(), ZoneOffset.UTC));
        e.setImmutable(record.immutable());
        jpa.save(e);
    }

    private PolicyVersionRecord toRecord(PolicyVersionEntity e) {
        return new PolicyVersionRecord(
                e.getId(),
                e.getVersion(),
                e.getStatus(),
                e.getArtifactJson(),
                e.getArtifactHash(),
                e.getAuthor(),
                e.getApprovalId(),
                e.getEffectiveAt() == null ? null : e.getEffectiveAt().toInstant(),
                e.getReleaseNote(),
                e.getGitCommit(),
                e.getCreatedAt().toInstant(),
                e.getPublishedAt() == null ? null : e.getPublishedAt().toInstant(),
                e.isImmutable()
        );
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
