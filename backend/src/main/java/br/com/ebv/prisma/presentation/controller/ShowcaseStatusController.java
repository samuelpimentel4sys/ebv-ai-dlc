package br.com.ebv.prisma.presentation.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/showcase")
@Tag(name = "Showcase", description = "Modo demo — só Supabase + stubs")
public class ShowcaseStatusController {

    private final Environment env;
    private final boolean showcase;
    private final boolean genai;
    private final String graph;
    private final String onnx;
    private final String liveness;
    private final String worm;

    public ShowcaseStatusController(
            Environment env,
            @Value("${prisma.showcase.enabled:false}") boolean showcase,
            @Value("${prisma.genai.enabled:true}") boolean genai,
            @Value("${prisma.graph.backend:stub}") String graph,
            @Value("${prisma.onnx.mode:stub}") String onnx,
            @Value("${prisma.liveness.mode:stub}") String liveness,
            @Value("${prisma.worm.backend:fs}") String worm
    ) {
        this.env = env;
        this.showcase = showcase;
        this.genai = genai;
        this.graph = graph;
        this.onnx = onnx;
        this.liveness = liveness;
        this.worm = worm;
    }

    @GetMapping("/status")
    @Operation(summary = "Status do modo showcase")
    public Map<String, Object> status() {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("showcase", showcase);
        body.put("profiles", Arrays.asList(env.getActiveProfiles()));
        body.put("infraProfile", Arrays.asList(env.getActiveProfiles()).contains("infra"));
        body.put("simulated", List.of(
                "redis", "kafka", "neo4j", "onnx", "liveness", "fairlearn", "minio", "keycloak",
                genai ? "(genai real se Emilly up)" : "genai-stub"
        ));
        body.put("backends", Map.of(
                "graph", graph,
                "onnx", onnx,
                "liveness", liveness,
                "worm", worm,
                "genai", genai ? "http" : "stub"
        ));
        body.put("required", List.of("supabase-postgres", "flyway"));
        body.put("partial", true);
        body.put("lab", true);
        return body;
    }
}
