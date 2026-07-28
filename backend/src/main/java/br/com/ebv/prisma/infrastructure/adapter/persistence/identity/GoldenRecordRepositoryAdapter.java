package br.com.ebv.prisma.infrastructure.adapter.persistence.identity;

import br.com.ebv.prisma.domain.identity.model.DocumentoCanonico;
import br.com.ebv.prisma.domain.identity.model.GoldenRecord;
import br.com.ebv.prisma.domain.identity.model.GoldenRecordId;
import br.com.ebv.prisma.domain.identity.model.GoldenRecordStatus;
import br.com.ebv.prisma.domain.identity.port.out.GoldenRecordRepositoryPort;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayDeque;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Queue;
import java.util.Set;
import java.util.UUID;

@Component
@Transactional
public class GoldenRecordRepositoryAdapter implements GoldenRecordRepositoryPort {

    private final GoldenRecordJpaRepository goldenRecordJpa;
    private final IdentityLinkJpaRepository linkJpa;
    private final IdentityMergeTrailJpaRepository trailJpa;
    private final IdentityCandidateJpaRepository candidateJpa;

    public GoldenRecordRepositoryAdapter(
            GoldenRecordJpaRepository goldenRecordJpa,
            IdentityLinkJpaRepository linkJpa,
            IdentityMergeTrailJpaRepository trailJpa,
            IdentityCandidateJpaRepository candidateJpa
    ) {
        this.goldenRecordJpa = goldenRecordJpa;
        this.linkJpa = linkJpa;
        this.trailJpa = trailJpa;
        this.candidateJpa = candidateJpa;
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<GoldenRecord> findActiveByDocumento(DocumentoCanonico documento) {
        return goldenRecordJpa.findLatestActiveByDocumento(documento.value()).map(this::toDomain);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<GoldenRecord> findById(GoldenRecordId id) {
        return goldenRecordJpa.findById(id.value()).map(this::toDomain);
    }

    @Override
    public GoldenRecord save(GoldenRecord record) {
        GoldenRecordEntity entity = goldenRecordJpa.findById(record.getId().value()).orElseGet(GoldenRecordEntity::new);
        entity.setGrId(record.getId().value());
        entity.setCanonicalDocumento(record.getCanonicalDocumento().value());
        entity.setVersion(record.getVersion());
        entity.setStatus(record.getStatus().name());
        entity.setUpdatedAt(OffsetDateTime.now());
        goldenRecordJpa.save(entity);

        for (GoldenRecord.IdentityLink link : record.getLinks()) {
            boolean exists = linkJpa.findByGrId(record.getId().value()).stream()
                    .anyMatch(l -> l.getSourceSystem().equals(link.sourceSystem()) && l.getSourceKey().equals(link.sourceKey()));
            if (!exists) {
                IdentityLinkEntity le = new IdentityLinkEntity();
                le.setId(UUID.randomUUID());
                le.setGrId(record.getId().value());
                le.setSourceSystem(link.sourceSystem());
                le.setSourceKey(link.sourceKey());
                le.setConfidence(link.confidence());
                linkJpa.save(le);
            }
        }
        return toDomain(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean wouldCreateCycle(GoldenRecordId survivor, GoldenRecordId merged) {
        // Trail MERGE: from_gr absorvido em to_gr. Ciclo se survivor já está na linhagem de merged
        // (survivor foi absorvido — direta/transitivamente — em merged).
        Map<UUID, Set<UUID>> absorbedInto = new HashMap<>();
        for (IdentityMergeTrailEntity t : trailJpa.findByAction("MERGE")) {
            if (t.getFromGr() == null || t.getToGr() == null) {
                continue;
            }
            absorbedInto.computeIfAbsent(t.getToGr(), k -> new HashSet<>()).add(t.getFromGr());
        }
        Queue<UUID> q = new ArrayDeque<>();
        q.add(merged.value());
        Set<UUID> visited = new HashSet<>();
        while (!q.isEmpty()) {
            UUID cur = q.poll();
            if (!visited.add(cur)) {
                continue;
            }
            if (cur.equals(survivor.value())) {
                return true;
            }
            for (UUID prev : absorbedInto.getOrDefault(cur, Set.of())) {
                q.add(prev);
            }
        }
        return false;
    }

    @Override
    public void appendMergeTrail(String action, GoldenRecordId from, GoldenRecordId to, UUID actor) {
        IdentityMergeTrailEntity trail = new IdentityMergeTrailEntity();
        trail.setId(UUID.randomUUID());
        trail.setAction(action);
        trail.setFromGr(from != null ? from.value() : null);
        trail.setToGr(to != null ? to.value() : null);
        trail.setActor(actor);
        trail.setAt(OffsetDateTime.now());
        trailJpa.save(trail);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasOpenMerge(GoldenRecordId merged, GoldenRecordId survivor) {
        List<IdentityMergeTrailEntity> pair = trailJpa.findByFromGrAndToGrOrderByAtAsc(
                merged.value(), survivor.value());
        boolean open = false;
        for (IdentityMergeTrailEntity t : pair) {
            if ("MERGE".equals(t.getAction())) {
                open = true;
            } else if ("UNDO".equals(t.getAction())) {
                open = false;
            }
        }
        return open;
    }

    @Override
    public void reassignLinks(GoldenRecordId from, GoldenRecordId to) {
        for (IdentityLinkEntity link : linkJpa.findByGrId(from.value())) {
            link.setGrId(to.value());
            linkJpa.save(link);
        }
    }

    @Override
    public UUID enqueueCandidate(GoldenRecordId left, GoldenRecordId right, BigDecimal confidence) {
        return candidateJpa.findPair(left.value(), right.value())
                .map(IdentityCandidateEntity::getId)
                .orElseGet(() -> {
                    IdentityCandidateEntity c = new IdentityCandidateEntity();
                    c.setId(UUID.randomUUID());
                    c.setLeftGr(left.value());
                    c.setRightGr(right.value());
                    c.setConfidence(confidence);
                    c.setStatus("PENDING");
                    c.setCreatedAt(OffsetDateTime.now());
                    return candidateJpa.save(c).getId();
                });
    }

    @Override
    @Transactional(readOnly = true)
    public List<CandidateRecord> listPendingCandidates() {
        return candidateJpa.findByStatusOrderByCreatedAtDesc("PENDING").stream()
                .map(c -> new CandidateRecord(
                        c.getId(),
                        GoldenRecordId.of(c.getLeftGr()),
                        GoldenRecordId.of(c.getRightGr()),
                        c.getConfidence(),
                        c.getStatus()
                ))
                .toList();
    }

    @Override
    public void resolveCandidate(GoldenRecordId left, GoldenRecordId right) {
        candidateJpa.findPair(left.value(), right.value()).ifPresent(c -> {
            c.setStatus("RESOLVED");
            candidateJpa.save(c);
        });
    }

    private GoldenRecord toDomain(GoldenRecordEntity entity) {
        GoldenRecord gr = new GoldenRecord(
                GoldenRecordId.of(entity.getGrId()),
                new DocumentoCanonico(entity.getCanonicalDocumento().trim()),
                entity.getVersion(),
                GoldenRecordStatus.valueOf(entity.getStatus())
        );
        for (IdentityLinkEntity link : linkJpa.findByGrId(entity.getGrId())) {
            gr.addLink(new GoldenRecord.IdentityLink(
                    GoldenRecordId.of(link.getGrId()),
                    link.getSourceSystem(),
                    link.getSourceKey(),
                    link.getConfidence()
            ));
        }
        return gr;
    }
}
