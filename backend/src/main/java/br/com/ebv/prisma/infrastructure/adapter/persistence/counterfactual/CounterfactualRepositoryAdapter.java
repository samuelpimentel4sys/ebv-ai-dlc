package br.com.ebv.prisma.infrastructure.adapter.persistence.counterfactual;

import br.com.ebv.prisma.domain.counterfactual.port.out.CounterfactualRepositoryPort;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;

@Component
@Transactional
public class CounterfactualRepositoryAdapter implements CounterfactualRepositoryPort {

    private final CounterfactualJpaRepository jpa;

    public CounterfactualRepositoryAdapter(CounterfactualJpaRepository jpa) {
        this.jpa = jpa;
    }

    @Override
    public void save(CounterfactualRecord record) {
        CounterfactualEntity e = new CounterfactualEntity();
        e.setDecisionId(record.decisionId());
        e.setActionsJson(record.actionsJson());
        e.setCreatedAt(OffsetDateTime.ofInstant(record.createdAt(), ZoneOffset.UTC));
        jpa.save(e);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<CounterfactualRecord> findByDecisionId(UUID decisionId) {
        return jpa.findById(decisionId).map(e -> new CounterfactualRecord(
                e.getDecisionId(), e.getActionsJson(), e.getCreatedAt().toInstant()
        ));
    }
}
