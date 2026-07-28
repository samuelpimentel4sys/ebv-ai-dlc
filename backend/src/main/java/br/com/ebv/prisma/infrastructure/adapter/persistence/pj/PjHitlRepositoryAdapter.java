package br.com.ebv.prisma.infrastructure.adapter.persistence.pj;

import br.com.ebv.prisma.domain.pj.port.out.PjHitlRepositoryPort;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
public class PjHitlRepositoryAdapter implements PjHitlRepositoryPort {

    private final PjOpinionJpaRepository opinionJpa;
    private final PjApprovalPolicyJpaRepository policyJpa;
    private final PjApprovalTrailJpaRepository trailJpa;
    private final PjGuardrailReportJpaRepository guardrailJpa;

    public PjHitlRepositoryAdapter(
            PjOpinionJpaRepository opinionJpa,
            PjApprovalPolicyJpaRepository policyJpa,
            PjApprovalTrailJpaRepository trailJpa,
            PjGuardrailReportJpaRepository guardrailJpa
    ) {
        this.opinionJpa = opinionJpa;
        this.policyJpa = policyJpa;
        this.trailJpa = trailJpa;
        this.guardrailJpa = guardrailJpa;
    }

    @Override
    public Optional<OpinionRecord> findOpinion(UUID opinionId) {
        return opinionJpa.findById(opinionId).map(e -> new OpinionRecord(
                e.getId(), e.getCnpj(), e.getStatus(), e.getCreatedBy(),
                e.getOperationAmount(), e.getCurrency()
        ));
    }

    @Override
    @Transactional
    public void updateOpinionStatus(UUID opinionId, String status) {
        PjOpinionEntity e = opinionJpa.findById(opinionId)
                .orElseThrow(() -> new IllegalStateException("opinion missing " + opinionId));
        e.setStatus(status);
        opinionJpa.save(e);
    }

    @Override
    public Optional<PolicyRecord> findPolicyForAmount(BigDecimal amount) {
        BigDecimal amt = amount == null ? BigDecimal.ZERO : amount;
        return policyJpa.findMatching(amt).stream().findFirst()
                .map(p -> new PolicyRecord(
                        p.getId(), p.getMinAmount(), p.getMaxAmount(),
                        p.getLevelCode(), p.getRoleRequired()));
    }

    @Override
    public List<PolicyRecord> listPoliciesOrdered() {
        return policyJpa.findAllByOrderByMinAmountAsc().stream()
                .map(p -> new PolicyRecord(
                        p.getId(), p.getMinAmount(), p.getMaxAmount(),
                        p.getLevelCode(), p.getRoleRequired()))
                .toList();
    }

    @Override
    @Transactional
    public void appendTrail(TrailRecord trail) {
        PjApprovalTrailEntity e = new PjApprovalTrailEntity();
        e.setId(trail.id());
        e.setOpinionId(trail.opinionId());
        e.setAction(trail.action());
        e.setActorId(trail.actorId());
        e.setLevelCode(trail.levelCode());
        e.setComment(trail.comment());
        e.setAt(trail.at());
        trailJpa.save(e);
    }

    @Override
    public List<TrailRecord> listTrail(UUID opinionId) {
        return trailJpa.findByOpinionIdOrderByAtAsc(opinionId).stream()
                .map(t -> new TrailRecord(
                        t.getId(), t.getOpinionId(), t.getAction(), t.getActorId(),
                        t.getLevelCode(), t.getComment(), t.getAt()))
                .toList();
    }

    @Override
    public Optional<String> latestGuardrailStatus(UUID opinionId) {
        return guardrailJpa.findFirstByOpinionIdOrderByCreatedAtDesc(opinionId)
                .map(PjGuardrailReportEntity::getStatus);
    }
}
