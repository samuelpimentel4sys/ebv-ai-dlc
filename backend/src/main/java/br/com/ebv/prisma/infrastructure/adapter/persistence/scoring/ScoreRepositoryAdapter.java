package br.com.ebv.prisma.infrastructure.adapter.persistence.scoring;

import br.com.ebv.prisma.domain.scoring.port.out.ScoreRepositoryPort;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

@Component
@Transactional
public class ScoreRepositoryAdapter implements ScoreRepositoryPort {

    private final ScoreCurrentJpaRepository currentJpa;
    private final ScoreHistoryJpaRepository historyJpa;

    public ScoreRepositoryAdapter(
            ScoreCurrentJpaRepository currentJpa,
            ScoreHistoryJpaRepository historyJpa
    ) {
        this.currentJpa = currentJpa;
        this.historyJpa = historyJpa;
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<CurrentScore> findCurrent(String documento) {
        return currentJpa.findById(documento)
                .map(e -> new CurrentScore(
                        e.getDocumento(),
                        e.getScore(),
                        e.getModelVersion(),
                        e.getUpdatedAt().toInstant()
                ));
    }

    @Override
    public void saveCurrent(String documento, BigDecimal score, String modelVersion) {
        ScoreCurrentEntity e = currentJpa.findById(documento).orElseGet(ScoreCurrentEntity::new);
        e.setDocumento(documento);
        e.setScore(score);
        e.setModelVersion(modelVersion);
        e.setUpdatedAt(OffsetDateTime.now(ZoneOffset.UTC));
        currentJpa.save(e);
    }

    @Override
    public void saveHistory(String documento, BigDecimal score, String modelVersion, String reason) {
        ScoreHistoryEntity e = new ScoreHistoryEntity();
        e.setDocumento(documento);
        e.setScore(score);
        e.setModelVersion(modelVersion);
        e.setReason(reason != null ? reason : "MANUAL");
        e.setAt(OffsetDateTime.now(ZoneOffset.UTC));
        historyJpa.save(e);
    }

    @Override
    @Transactional(readOnly = true)
    public List<HistoryEntry> findHistory(String documento, int page, int size) {
        return historyJpa.findByDocumentoOrderByAtDesc(documento, PageRequest.of(page, size))
                .stream()
                .map(e -> new HistoryEntry(
                        e.getId(),
                        e.getDocumento(),
                        e.getScore(),
                        e.getModelVersion(),
                        e.getReason(),
                        e.getAt().toInstant()
                ))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public long countHistory(String documento) {
        return historyJpa.countByDocumento(documento);
    }
}
