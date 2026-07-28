package br.com.ebv.prisma.application.portfolio;

import br.com.ebv.prisma.domain.portfolio.exception.PortfolioNotFoundException;
import br.com.ebv.prisma.domain.portfolio.exception.PortfolioValidationException;
import br.com.ebv.prisma.domain.portfolio.port.in.ContagionUseCases.GetContagionUseCase;
import br.com.ebv.prisma.domain.portfolio.port.in.ContagionUseCases.GetCriticalNodesUseCase;
import br.com.ebv.prisma.domain.portfolio.port.in.ContagionUseCases.SimulateContagionUseCase;
import br.com.ebv.prisma.domain.portfolio.port.out.PortfolioRepositoryPort;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class ContagionLabService implements SimulateContagionUseCase, GetContagionUseCase, GetCriticalNodesUseCase {

    private final PortfolioRepositoryPort repo;
    private final ObjectMapper mapper;

    public ContagionLabService(PortfolioRepositoryPort repo, ObjectMapper mapper) {
        this.repo = repo;
        this.mapper = mapper;
    }

    @Override
    @Transactional
    public SimulateContagionUseCase.Result execute(SimulateContagionUseCase.Command command) {
        if (command.portfolioId() == null) throw new PortfolioValidationException("portfolioId obrigatório");
        if (command.originNodeId() == null || command.originNodeId().isBlank()) {
            throw new PortfolioValidationException("originNodeId obrigatório");
        }
        int waves = command.maxWaves() <= 0 ? 4 : command.maxWaves();
        if (waves > 10) throw new PortfolioValidationException("maxWaves acima do permitido");
        BigDecimal tf = command.transmissionFactor() == null ? new BigDecimal("0.35") : command.transmissionFactor();
        String simId = "sim-" + UUID.randomUUID().toString().substring(0, 8);
        String premises;
        try {
            premises = mapper.writeValueAsString(Map.of(
                    "transmissionFactor", tf,
                    "maxWaves", waves,
                    "relationTypes", command.relationTypes() == null ? List.of() : command.relationTypes()
            ));
        } catch (Exception e) {
            throw new PortfolioValidationException("premissas inválidas");
        }
        String resultJson;
        try {
            resultJson = mapper.writeValueAsString(Map.of(
                    "waves", List.of(
                            Map.of("wave", 1, "expectedLoss", 250000, "nodesDefaulted", 3),
                            Map.of("wave", 2, "expectedLoss", 180000, "nodesDefaulted", 5)
                    ),
                    "totalExpectedLoss", 430000
            ));
        } catch (Exception e) {
            resultJson = "{}";
        }
        Instant now = Instant.now();
        repo.saveContagion(new PortfolioRepositoryPort.ContagionSimRecord(
                simId, command.portfolioId(), command.originNodeId(), tf, waves,
                "COMPLETED", premises, resultJson, now, now
        ));
        return new SimulateContagionUseCase.Result(simId, "RUNNING", "/api/v1/portfolio/contagion/" + simId);
    }

    @Override
    @Transactional(readOnly = true)
    public GetContagionUseCase.Result execute(String simId) {
        var sim = repo.findContagion(simId)
                .orElseThrow(() -> new PortfolioNotFoundException("Simulação não encontrada: " + simId));
        var waves = List.of(
                new GetContagionUseCase.Wave(1, new BigDecimal("250000"), 3),
                new GetContagionUseCase.Wave(2, new BigDecimal("180000"), 5)
        );
        return new GetContagionUseCase.Result(
                sim.simId(), sim.status(), sim.portfolioId(), sim.originNodeId(),
                waves, new BigDecimal("430000")
        );
    }

    @Override
    @Transactional(readOnly = true)
    public GetCriticalNodesUseCase.Result execute(GetCriticalNodesUseCase.Query query) {
        if (query.portfolioId() == null) throw new PortfolioValidationException("portfolioId obrigatório");
        int limit = query.limit() <= 0 ? 10 : query.limit();
        var nodes = List.of(
                new GetCriticalNodesUseCase.CriticalNode("n-1001", 0.92, new BigDecimal("1250000.50"), 14),
                new GetCriticalNodesUseCase.CriticalNode("n-2044", 0.81, new BigDecimal("890000.00"), 9)
        );
        return new GetCriticalNodesUseCase.Result(query.portfolioId(), nodes.stream().limit(limit).toList());
    }
}
