package br.com.ebv.prisma.presentation.controller;

import br.com.ebv.prisma.domain.mission.port.in.ListAchievementsUseCase;
import br.com.ebv.prisma.domain.mission.port.in.ListMissionsUseCase;
import br.com.ebv.prisma.domain.mission.port.in.ProgressMissionUseCase;
import br.com.ebv.prisma.presentation.dto.mission.ProgressMissionRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/missions")
@Tag(name = "Missions", description = "PRISMA-EP-06-F05 Gamificação")
public class MissionController {

    private final ListMissionsUseCase list;
    private final ProgressMissionUseCase progress;
    private final ListAchievementsUseCase achievements;

    public MissionController(ListMissionsUseCase list, ProgressMissionUseCase progress, ListAchievementsUseCase achievements) {
        this.list = list;
        this.progress = progress;
        this.achievements = achievements;
    }

    @GetMapping
    @Operation(summary = "Lista missões elegíveis")
    public Map<String, Object> list(@RequestParam String documento) {
        var r = list.execute(new ListMissionsUseCase.Query(documento));
        List<Map<String, Object>> missions = r.missions().stream().map(m -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("missionId", m.missionId().toString());
            row.put("code", m.code());
            row.put("title", m.title());
            row.put("status", m.status());
            row.put("progressPct", m.progressPct());
            return row;
        }).toList();
        return Map.of("missions", missions);
    }

    @PostMapping("/{id}/progress")
    @Operation(summary = "Apura progresso de missão")
    public Map<String, Object> progress(@PathVariable("id") UUID id, @Valid @RequestBody ProgressMissionRequest req) {
        var r = progress.execute(new ProgressMissionUseCase.Command(
                id, req.documento(), req.verifiedEventType(), req.verifiedEventId(), req.deltaPct()));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("enrollmentId", r.enrollmentId().toString());
        body.put("progressPct", r.progressPct());
        body.put("status", r.status());
        body.put("achievementEarned", r.achievementEarned());
        return body;
    }

    @GetMapping("/achievements")
    @Operation(summary = "Conquistas simbólicas")
    public Map<String, Object> achievements(@RequestParam String documento) {
        var r = achievements.execute(new ListAchievementsUseCase.Query(documento));
        List<Map<String, Object>> items = r.achievements().stream().map(a -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("achievementId", a.achievementId().toString());
            m.put("code", a.code());
            m.put("title", a.title());
            return m;
        }).toList();
        return Map.of("achievements", items);
    }
}
