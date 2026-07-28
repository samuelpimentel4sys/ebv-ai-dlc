package br.com.ebv.prisma.application.portfolio;

import br.com.ebv.prisma.domain.portfolio.exception.PortfolioValidationException;
import br.com.ebv.prisma.domain.portfolio.port.in.LimitsUseCases.GetConcentrationUseCase;
import br.com.ebv.prisma.domain.portfolio.port.in.LimitsUseCases.ListAlertsUseCase;
import br.com.ebv.prisma.domain.portfolio.port.in.LimitsUseCases.UpsertLimitUseCase;
import br.com.ebv.prisma.domain.portfolio.port.out.PortfolioRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class LimitsLabService implements GetConcentrationUseCase, UpsertLimitUseCase, ListAlertsUseCase {

    private final PortfolioRepositoryPort repo;

    public LimitsLabService(PortfolioRepositoryPort repo) {
        this.repo = repo;
    }

    @Override
    @Transactional(readOnly = true)
    public GetConcentrationUseCase.Result execute(GetConcentrationUseCase.Query query) {
        if (query.portfolioId() == null) throw new PortfolioValidationException("portfolioId obrigatório");
        var limits = repo.listLimits(query.portfolioId());
        BigDecimal thr = limits.isEmpty() ? new BigDecimal("30.0") : limits.get(0).thresholdPct();
        BigDecimal warn = limits.isEmpty() ? new BigDecimal("27.0") : limits.get(0).warnPct();
        String dim = limits.isEmpty() ? "SETOR" : limits.get(0).dimension();
        return new GetConcentrationUseCase.Result(query.portfolioId(), List.of(
                new GetConcentrationUseCase.DimensionRow(dim, "VAREJO", new BigDecimal("28.4"), thr, warn, "WARN")
        ));
    }

    @Override
    @Transactional
    public UpsertLimitUseCase.Result execute(UpsertLimitUseCase.Command command) {
        if (command.portfolioId() == null) throw new PortfolioValidationException("portfolioId obrigatório");
        if (command.dimension() == null || command.dimension().isBlank()) {
            throw new PortfolioValidationException("dimension obrigatório");
        }
        if (command.thresholdPct() == null || command.warnPct() == null) {
            throw new PortfolioValidationException("thresholdPct e warnPct obrigatórios");
        }
        if (command.warnPct().compareTo(command.thresholdPct()) > 0) {
            throw new PortfolioValidationException("warnPct não pode exceder thresholdPct");
        }
        UUID id = UUID.randomUUID();
        repo.saveLimit(new PortfolioRepositoryPort.LimitRecord(
                id, command.portfolioId(), command.dimension().toUpperCase(),
                command.thresholdPct(), command.warnPct(), Instant.now()
        ));
        return new UpsertLimitUseCase.Result(
                id, command.portfolioId(), command.dimension().toUpperCase(),
                command.thresholdPct(), command.warnPct()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public ListAlertsUseCase.Result execute(ListAlertsUseCase.Query query) {
        if (query.portfolioId() == null) throw new PortfolioValidationException("portfolioId obrigatório");
        var alerts = repo.listAlerts(query.portfolioId()).stream()
                .filter(a -> query.status() == null || query.status().isBlank() || a.status().equalsIgnoreCase(query.status()))
                .map(a -> new ListAlertsUseCase.Alert(
                        a.alertId().toString(), a.dimension(), a.dimKey(), a.severity(), a.status(), a.message()))
                .toList();
        if (alerts.isEmpty()) {
            alerts = List.of(new ListAlertsUseCase.Alert(
                    UUID.randomUUID().toString(), "SETOR", "VAREJO", "WARN", "OPEN",
                    "Concentração próxima do limite (lab stub)"));
        }
        return new ListAlertsUseCase.Result(query.portfolioId(), alerts);
    }
}
