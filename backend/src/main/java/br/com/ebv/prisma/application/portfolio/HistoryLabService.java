package br.com.ebv.prisma.application.portfolio;

import br.com.ebv.prisma.domain.portfolio.exception.PortfolioValidationException;
import br.com.ebv.prisma.domain.portfolio.port.in.HistoryUseCases.CompareSnapshotsUseCase;
import br.com.ebv.prisma.domain.portfolio.port.in.HistoryUseCases.GetSnapshotUseCase;
import br.com.ebv.prisma.domain.portfolio.port.in.HistoryUseCases.GetTimelineUseCase;
import br.com.ebv.prisma.domain.portfolio.port.out.PortfolioRepositoryPort;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class HistoryLabService implements GetSnapshotUseCase, CompareSnapshotsUseCase, GetTimelineUseCase {

    private final PortfolioRepositoryPort repo;
    private final ObjectMapper mapper;

    public HistoryLabService(PortfolioRepositoryPort repo, ObjectMapper mapper) {
        this.repo = repo;
        this.mapper = mapper;
    }

    @Override
    @Transactional(readOnly = true)
    public GetSnapshotUseCase.Result execute(GetSnapshotUseCase.Query query) {
        if (query.portfolioId() == null) throw new PortfolioValidationException("portfolioId obrigatório");
        if (query.date() == null) throw new PortfolioValidationException("date obrigatório");
        var existing = repo.findSnapshot(query.portfolioId(), query.date());
        if (existing.isPresent()) {
            var s = existing.get();
            Map<String, Object> summary;
            try {
                summary = mapper.readValue(s.summaryJson(), new TypeReference<>() {});
            } catch (Exception e) {
                summary = Map.of("totalExposure", 1_200_000_000.0, "npl", 3.9);
            }
            return new GetSnapshotUseCase.Result(
                    s.asOfDate(), s.aggregateVersion(), s.nodeCount(), s.divergenceFlag(), summary);
        }
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("totalExposure", 1_200_000_000.0);
        summary.put("npl", 3.9);
        return new GetSnapshotUseCase.Result(
                query.date(), "hist-lab-" + query.date(), 15_000, false, summary);
    }

    @Override
    @Transactional(readOnly = true)
    public CompareSnapshotsUseCase.Result execute(CompareSnapshotsUseCase.Command command) {
        if (command.portfolioId() == null) throw new PortfolioValidationException("portfolioId obrigatório");
        if (command.dateA() == null || command.dateB() == null) {
            throw new PortfolioValidationException("dateA e dateB obrigatórios");
        }
        Map<String, Object> details = new LinkedHashMap<>();
        details.put("nodesAdded", 120);
        details.put("nodesRemoved", 45);
        return new CompareSnapshotsUseCase.Result(
                command.dateA(), command.dateB(),
                new BigDecimal("15000000.00"), new BigDecimal("0.15"), details
        );
    }

    @Override
    @Transactional(readOnly = true)
    public GetTimelineUseCase.Result execute(GetTimelineUseCase.Query query) {
        if (query.portfolioId() == null) throw new PortfolioValidationException("portfolioId obrigatório");
        var events = repo.listTimeline(query.portfolioId()).stream()
                .map(e -> new GetTimelineUseCase.Event(
                        e.eventId().toString(), e.eventAt(), e.eventType(), e.label()))
                .toList();
        if (events.isEmpty()) {
            events = List.of(new GetTimelineUseCase.Event(
                    UUID.randomUUID().toString(), Instant.now().minusSeconds(86400),
                    "MACRO_SHOCK", "Choque Selic +200bps (lab)"));
        }
        return new GetTimelineUseCase.Result(query.portfolioId(), events);
    }
}
