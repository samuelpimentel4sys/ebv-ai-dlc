package br.com.ebv.prisma.application.scoring;

import br.com.ebv.prisma.domain.identity.exception.GoldenRecordNotFoundException;
import br.com.ebv.prisma.domain.scoring.port.in.GetScoreUseCase;
import br.com.ebv.prisma.domain.scoring.port.out.ScoreRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class GetScoreService implements GetScoreUseCase {

    private final ScoreRepositoryPort scoreRepo;

    public GetScoreService(ScoreRepositoryPort scoreRepo) {
        this.scoreRepo = scoreRepo;
    }

    @Override
    @Transactional(readOnly = true)
    public ScoreSummary getCurrent(String documento) {
        String doc = digits(documento);
        var current = scoreRepo.findCurrent(doc)
                .orElseThrow(() -> new GoldenRecordNotFoundException("Score não encontrado: " + doc));
        return new ScoreSummary(current.documento(), current.score(), current.modelVersion(), current.updatedAt());
    }

    @Override
    @Transactional(readOnly = true)
    public ScoreHistoryPage getHistory(String documento, int page, int size) {
        String doc = digits(documento);
        List<HistoryEntry> items = scoreRepo.findHistory(doc, page, size).stream()
                .map(e -> new HistoryEntry(e.score(), e.modelVersion(), e.reason(), e.at()))
                .toList();
        long total = scoreRepo.countHistory(doc);
        return new ScoreHistoryPage(items, page, size, total);
    }

    private static String digits(String raw) {
        return raw == null ? "" : raw.replaceAll("\\D", "");
    }
}
