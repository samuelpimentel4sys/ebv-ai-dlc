package br.com.ebv.prisma.application.portfolio;

import br.com.ebv.prisma.domain.portfolio.exception.PortfolioNotFoundException;
import br.com.ebv.prisma.domain.portfolio.exception.PortfolioValidationException;
import br.com.ebv.prisma.domain.portfolio.port.in.StressUseCases.GetStressRunUseCase;
import br.com.ebv.prisma.domain.portfolio.port.in.StressUseCases.ListStressScenariosUseCase;
import br.com.ebv.prisma.domain.portfolio.port.in.StressUseCases.RunStressUseCase;
import br.com.ebv.prisma.domain.portfolio.port.out.PortfolioRepositoryPort;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class StressLabService implements RunStressUseCase, ListStressScenariosUseCase, GetStressRunUseCase {

    private final PortfolioRepositoryPort repo;
    private final ObjectMapper mapper;

    public StressLabService(PortfolioRepositoryPort repo, ObjectMapper mapper) {
        this.repo = repo;
        this.mapper = mapper;
    }

    @Override
    @Transactional
    public RunStressUseCase.Result execute(RunStressUseCase.Command command) {
        if (command.portfolioId() == null) throw new PortfolioValidationException("portfolioId obrigatório");
        long t0 = System.currentTimeMillis();
        String runId = "run-" + UUID.randomUUID().toString().substring(0, 8);
        String vars;
        try {
            vars = mapper.writeValueAsString(command.variables() == null ? Map.of() : command.variables());
        } catch (Exception e) {
            throw new PortfolioValidationException("variables inválidas");
        }
        BigDecimal baseline = new BigDecimal("4.20");
        BigDecimal stressed = new BigDecimal("5.85");
        BigDecimal delta = new BigDecimal("13200000.00");
        String agg = "agg-lab-" + Instant.now();
        String resultJson;
        try {
            resultJson = mapper.writeValueAsString(Map.of(
                    "baselineNpl", baseline, "stressedNpl", stressed, "expectedLossDelta", delta
            ));
        } catch (Exception e) {
            resultJson = "{}";
        }
        Instant now = Instant.now();
        repo.saveStressRun(new PortfolioRepositoryPort.StressRunRecord(
                runId, command.portfolioId(), null, "COMPLETED", vars, resultJson, agg, now, now
        ));
        return new RunStressUseCase.Result(
                runId, "COMPLETED", System.currentTimeMillis() - t0, agg, baseline, stressed, delta, false
        );
    }

    @Override
    @Transactional(readOnly = true)
    public ListStressScenariosUseCase.Result execute() {
        List<ListStressScenariosUseCase.Scenario> scenarios = repo.listStressScenarios().stream().map(s -> {
            Map<String, Object> vars;
            try {
                vars = mapper.readValue(s.variablesJson(), new TypeReference<>() {});
            } catch (Exception e) {
                vars = Map.of();
            }
            return new ListStressScenariosUseCase.Scenario(s.code(), s.kind(), s.label(), vars);
        }).toList();
        if (scenarios.isEmpty()) {
            scenarios = List.of(new ListStressScenariosUseCase.Scenario(
                    "BASELINE", "PRESET", "Baseline macro",
                    Map.of("selic", 10.5, "unemployment", 7.5)));
        }
        return new ListStressScenariosUseCase.Result(scenarios);
    }

    @Override
    @Transactional(readOnly = true)
    public GetStressRunUseCase.Result execute(String runId) {
        var run = repo.findStressRun(runId)
                .orElseThrow(() -> new PortfolioNotFoundException("Stress run não encontrado: " + runId));
        BigDecimal baseline = new BigDecimal("4.20");
        BigDecimal stressed = new BigDecimal("5.85");
        BigDecimal delta = new BigDecimal("13200000.00");
        try {
            Map<String, Object> m = mapper.readValue(run.resultJson() == null ? "{}" : run.resultJson(),
                    new TypeReference<>() {});
            if (m.get("baselineNpl") != null) baseline = new BigDecimal(m.get("baselineNpl").toString());
            if (m.get("stressedNpl") != null) stressed = new BigDecimal(m.get("stressedNpl").toString());
            if (m.get("expectedLossDelta") != null) delta = new BigDecimal(m.get("expectedLossDelta").toString());
        } catch (Exception ignored) {
            // lab stub defaults
        }
        return new GetStressRunUseCase.Result(
                run.runId(), run.status(), run.portfolioId(), run.aggregateVersion(), baseline, stressed, delta
        );
    }
}
