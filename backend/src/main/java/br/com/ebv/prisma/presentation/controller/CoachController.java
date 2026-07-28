package br.com.ebv.prisma.presentation.controller;

import br.com.ebv.prisma.domain.coach.port.in.GetCoachJourneyUseCase;
import br.com.ebv.prisma.domain.coach.port.in.GetCoachProgressUseCase;
import br.com.ebv.prisma.domain.coach.port.in.GetCoachSimulationHistoryUseCase;
import br.com.ebv.prisma.domain.coach.port.in.SimulateCoachActionUseCase;
import br.com.ebv.prisma.domain.coach.port.in.UpsertCoachGoalsUseCase;
import br.com.ebv.prisma.presentation.dto.coach.SimulateCoachActionRequest;
import br.com.ebv.prisma.presentation.dto.coach.UpsertCoachGoalsRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/coach")
@Tag(name = "Coach", description = "PRISMA-EP-06-F03/F06 Jornada + simulação de efeito")
public class CoachController {

    private final GetCoachJourneyUseCase journey;
    private final UpsertCoachGoalsUseCase goals;
    private final GetCoachProgressUseCase progress;
    private final SimulateCoachActionUseCase simulate;
    private final GetCoachSimulationHistoryUseCase history;

    public CoachController(
            GetCoachJourneyUseCase journey,
            UpsertCoachGoalsUseCase goals,
            GetCoachProgressUseCase progress,
            SimulateCoachActionUseCase simulate,
            GetCoachSimulationHistoryUseCase history
    ) {
        this.journey = journey;
        this.goals = goals;
        this.progress = progress;
        this.simulate = simulate;
        this.history = history;
    }

    @GetMapping("/journey")
    @Operation(summary = "Monta trilha personalizada")
    public Map<String, Object> journey(@RequestParam String documento) {
        var r = journey.execute(new GetCoachJourneyUseCase.Query(documento));
        List<Map<String, Object>> goalsOut = r.goals().stream().map(g -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("goalId", g.goalId().toString());
            m.put("goalType", g.goalType());
            m.put("title", g.title());
            m.put("estimateText", g.estimateText());
            m.put("status", g.status());
            return m;
        }).toList();
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("journeyId", r.journeyId().toString());
        body.put("status", r.status());
        body.put("goals", goalsOut);
        return body;
    }

    @PostMapping("/goals")
    @Operation(summary = "Define/atualiza metas")
    public Map<String, Object> goals(@Valid @RequestBody UpsertCoachGoalsRequest req) {
        var inputs = req.goals().stream()
                .map(g -> new UpsertCoachGoalsUseCase.GoalInput(g.goalType(), g.title(), g.estimateText(), g.guaranteesApproval()))
                .toList();
        var r = goals.execute(new UpsertCoachGoalsUseCase.Command(req.documento(), inputs));
        List<Map<String, Object>> out = r.goals().stream().map(g -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("goalId", g.goalId().toString());
            m.put("title", g.title());
            m.put("status", g.status());
            return m;
        }).toList();
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("journeyId", r.journeyId().toString());
        body.put("goals", out);
        return body;
    }

    @GetMapping("/progress")
    @Operation(summary = "Apura progresso")
    public Map<String, Object> progress(@RequestParam String documento) {
        var r = progress.execute(new GetCoachProgressUseCase.Query(documento));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("journeyId", r.journeyId().toString());
        body.put("percentComplete", r.percentComplete());
        body.put("goalsDone", r.goalsDone());
        body.put("goalsTotal", r.goalsTotal());
        return body;
    }

    @PostMapping("/simulate")
    @Operation(summary = "Estima efeito de ação")
    public Map<String, Object> simulate(@Valid @RequestBody SimulateCoachActionRequest req) {
        var r = simulate.execute(new SimulateCoachActionUseCase.Command(
                req.documento(), req.actionCode(), req.snapshotScoreId()));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("simulationId", r.simulationId().toString());
        body.put("estimable", r.estimable());
        body.put("scoreDeltaMin", r.scoreDeltaMin());
        body.put("scoreDeltaMax", r.scoreDeltaMax());
        body.put("effectDaysMin", r.effectDaysMin());
        body.put("effectDaysMax", r.effectDaysMax());
        body.put("message", r.message());
        return body;
    }

    @GetMapping("/simulations/history")
    @Operation(summary = "Histórico de simulações")
    public Map<String, Object> history(@RequestParam String documento) {
        var r = history.execute(new GetCoachSimulationHistoryUseCase.Query(documento));
        List<Map<String, Object>> sims = r.simulations().stream().map(s -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("simulationId", s.simulationId().toString());
            m.put("actionCode", s.actionCode());
            m.put("estimable", s.estimable());
            m.put("message", s.message());
            return m;
        }).toList();
        return Map.of("simulations", sims);
    }
}
