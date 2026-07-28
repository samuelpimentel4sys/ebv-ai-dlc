package br.com.ebv.prisma.presentation.controller;

import br.com.ebv.prisma.domain.portfolio.port.in.AggregatesUseCases.GetAggregatesUseCase;
import br.com.ebv.prisma.domain.portfolio.port.in.AggregatesUseCases.GetFreshnessUseCase;
import br.com.ebv.prisma.domain.portfolio.port.in.AggregatesUseCases.RefreshAggregatesUseCase;
import br.com.ebv.prisma.domain.portfolio.port.in.CommunitiesUseCases.DetectCommunitiesUseCase;
import br.com.ebv.prisma.domain.portfolio.port.in.CommunitiesUseCases.GetCommunityUseCase;
import br.com.ebv.prisma.domain.portfolio.port.in.CommunitiesUseCases.ListCommunitiesUseCase;
import br.com.ebv.prisma.domain.portfolio.port.in.ContagionUseCases.GetContagionUseCase;
import br.com.ebv.prisma.domain.portfolio.port.in.ContagionUseCases.GetCriticalNodesUseCase;
import br.com.ebv.prisma.domain.portfolio.port.in.ContagionUseCases.SimulateContagionUseCase;
import br.com.ebv.prisma.domain.portfolio.port.in.GraphUseCases.FilterGraphUseCase;
import br.com.ebv.prisma.domain.portfolio.port.in.GraphUseCases.GetGraphNodeUseCase;
import br.com.ebv.prisma.domain.portfolio.port.in.GraphUseCases.GetGraphUseCase;
import br.com.ebv.prisma.domain.portfolio.port.in.GraphUseCases.GetProjection2dUseCase;
import br.com.ebv.prisma.domain.portfolio.port.in.GraphUseCases.GetTabularUseCase;
import br.com.ebv.prisma.domain.portfolio.port.in.HistoryUseCases.CompareSnapshotsUseCase;
import br.com.ebv.prisma.domain.portfolio.port.in.HistoryUseCases.GetSnapshotUseCase;
import br.com.ebv.prisma.domain.portfolio.port.in.HistoryUseCases.GetTimelineUseCase;
import br.com.ebv.prisma.domain.portfolio.port.in.LimitsUseCases.GetConcentrationUseCase;
import br.com.ebv.prisma.domain.portfolio.port.in.LimitsUseCases.ListAlertsUseCase;
import br.com.ebv.prisma.domain.portfolio.port.in.LimitsUseCases.UpsertLimitUseCase;
import br.com.ebv.prisma.domain.portfolio.port.in.ReportsUseCases.CreateReportUseCase;
import br.com.ebv.prisma.domain.portfolio.port.in.ReportsUseCases.DownloadReportUseCase;
import br.com.ebv.prisma.domain.portfolio.port.in.ReportsUseCases.GetReportUseCase;
import br.com.ebv.prisma.domain.portfolio.port.in.StressUseCases.GetStressRunUseCase;
import br.com.ebv.prisma.domain.portfolio.port.in.StressUseCases.ListStressScenariosUseCase;
import br.com.ebv.prisma.domain.portfolio.port.in.StressUseCases.RunStressUseCase;
import br.com.ebv.prisma.presentation.dto.portfolio.PortfolioRequests;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/portfolio")
@Tag(name = "Portfolio", description = "PRISMA-EP-04 Sala de Risco / Portfólio (lab)")
public class PortfolioController {

    private final GetGraphUseCase getGraph;
    private final GetGraphNodeUseCase getGraphNode;
    private final FilterGraphUseCase filterGraph;
    private final GetProjection2dUseCase projection2d;
    private final GetTabularUseCase tabular;
    private final SimulateContagionUseCase simulateContagion;
    private final GetContagionUseCase getContagion;
    private final GetCriticalNodesUseCase criticalNodes;
    private final RunStressUseCase runStress;
    private final ListStressScenariosUseCase listScenarios;
    private final GetStressRunUseCase getStressRun;
    private final GetConcentrationUseCase concentration;
    private final UpsertLimitUseCase upsertLimit;
    private final ListAlertsUseCase listAlerts;
    private final GetAggregatesUseCase getAggregates;
    private final RefreshAggregatesUseCase refreshAggregates;
    private final GetFreshnessUseCase freshness;
    private final DetectCommunitiesUseCase detectCommunities;
    private final ListCommunitiesUseCase listCommunities;
    private final GetCommunityUseCase getCommunity;
    private final GetSnapshotUseCase getSnapshot;
    private final CompareSnapshotsUseCase compareSnapshots;
    private final GetTimelineUseCase timeline;
    private final CreateReportUseCase createReport;
    private final GetReportUseCase getReport;
    private final DownloadReportUseCase downloadReport;

    public PortfolioController(
            GetGraphUseCase getGraph,
            GetGraphNodeUseCase getGraphNode,
            FilterGraphUseCase filterGraph,
            GetProjection2dUseCase projection2d,
            GetTabularUseCase tabular,
            SimulateContagionUseCase simulateContagion,
            GetContagionUseCase getContagion,
            GetCriticalNodesUseCase criticalNodes,
            RunStressUseCase runStress,
            ListStressScenariosUseCase listScenarios,
            GetStressRunUseCase getStressRun,
            GetConcentrationUseCase concentration,
            UpsertLimitUseCase upsertLimit,
            ListAlertsUseCase listAlerts,
            GetAggregatesUseCase getAggregates,
            RefreshAggregatesUseCase refreshAggregates,
            GetFreshnessUseCase freshness,
            DetectCommunitiesUseCase detectCommunities,
            ListCommunitiesUseCase listCommunities,
            GetCommunityUseCase getCommunity,
            GetSnapshotUseCase getSnapshot,
            CompareSnapshotsUseCase compareSnapshots,
            GetTimelineUseCase timeline,
            CreateReportUseCase createReport,
            GetReportUseCase getReport,
            DownloadReportUseCase downloadReport
    ) {
        this.getGraph = getGraph;
        this.getGraphNode = getGraphNode;
        this.filterGraph = filterGraph;
        this.projection2d = projection2d;
        this.tabular = tabular;
        this.simulateContagion = simulateContagion;
        this.getContagion = getContagion;
        this.criticalNodes = criticalNodes;
        this.runStress = runStress;
        this.listScenarios = listScenarios;
        this.getStressRun = getStressRun;
        this.concentration = concentration;
        this.upsertLimit = upsertLimit;
        this.listAlerts = listAlerts;
        this.getAggregates = getAggregates;
        this.refreshAggregates = refreshAggregates;
        this.freshness = freshness;
        this.detectCommunities = detectCommunities;
        this.listCommunities = listCommunities;
        this.getCommunity = getCommunity;
        this.getSnapshot = getSnapshot;
        this.compareSnapshots = compareSnapshots;
        this.timeline = timeline;
        this.createReport = createReport;
        this.getReport = getReport;
        this.downloadReport = downloadReport;
    }

    // --- F01 ---
    @GetMapping("/graph")
    @Operation(summary = "Topologia agregada por LOD")
    public Map<String, Object> graph(
            @RequestParam UUID portfolioId,
            @RequestParam(required = false, defaultValue = "2") int lod,
            @RequestParam(required = false, defaultValue = "50000") int maxNodes
    ) {
        var r = getGraph.execute(new GetGraphUseCase.Query(portfolioId, lod, maxNodes));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("portfolioId", r.portfolioId().toString());
        body.put("lod", r.lod());
        body.put("nodeCount", r.nodeCount());
        body.put("edgeCount", r.edgeCount());
        body.put("aggregateVersion", r.aggregateVersion());
        body.put("latencyMs", r.latencyMs());
        body.put("nodes", r.nodes());
        body.put("edges", r.edges());
        body.put("truncated", r.truncated());
        return body;
    }

    @GetMapping("/graph/node/{nodeId}")
    @Operation(summary = "Detalhe do nó + vizinhança")
    public Map<String, Object> graphNode(
            @PathVariable String nodeId,
            @RequestParam UUID portfolioId
    ) {
        var r = getGraphNode.execute(new GetGraphNodeUseCase.Query(portfolioId, nodeId));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("nodeId", r.nodeId());
        body.put("exposure", r.exposure());
        body.put("riskBand", r.riskBand());
        body.put("score", r.score());
        body.put("neighbors", r.neighbors());
        return body;
    }

    @PostMapping("/graph/filter")
    @Operation(summary = "Aplica filtros e recalcula recorte")
    public Map<String, Object> graphFilter(@Valid @RequestBody PortfolioRequests.FilterGraphRequest req) {
        var r = filterGraph.execute(new FilterGraphUseCase.Command(
                req.portfolioId(),
                req.lod() == null ? 2 : req.lod(),
                req.maxNodes() == null ? 50_000 : req.maxNodes(),
                req.criteria()
        ));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("filterId", r.filterId().toString());
        body.put("portfolioId", r.portfolioId().toString());
        body.put("lod", r.lod());
        body.put("maxNodes", r.maxNodes());
        body.put("nodeCount", r.nodeCount());
        body.put("truncated", r.truncated());
        return body;
    }

    // --- F09 (antes de path genéricos) ---
    @GetMapping("/graph/2d")
    @Operation(summary = "Projeção 2D da topologia")
    public Map<String, Object> graph2d(
            @RequestParam UUID portfolioId,
            @RequestParam(required = false) String filterId
    ) {
        var r = projection2d.execute(new GetProjection2dUseCase.Query(portfolioId, filterId));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("nodes", r.nodes());
        body.put("edges", r.edges());
        body.put("parityWith3d", r.parityWith3d());
        return body;
    }

    @GetMapping("/graph/tabular")
    @Operation(summary = "Fallback tabular a11y")
    public Map<String, Object> graphTabular(
            @RequestParam UUID portfolioId,
            @RequestParam(required = false) String filterId
    ) {
        var r = tabular.execute(new GetTabularUseCase.Query(portfolioId, filterId));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("rows", r.rows());
        body.put("total", r.total());
        return body;
    }

    // --- F02 ---
    @PostMapping("/contagion/simulate")
    @Operation(summary = "Propaga default a partir de nó origem")
    public ResponseEntity<Map<String, Object>> contagionSimulate(
            @Valid @RequestBody PortfolioRequests.SimulateContagionRequest req
    ) {
        var r = simulateContagion.execute(new SimulateContagionUseCase.Command(
                req.portfolioId(), req.originNodeId(), req.transmissionFactor(),
                req.maxWaves() == null ? 4 : req.maxWaves(), req.relationTypes()
        ));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("simId", r.simId());
        body.put("status", r.status());
        body.put("pollUrl", r.pollUrl());
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(body);
    }

    @GetMapping("/contagion/critical")
    @Operation(summary = "Ranking de nós sistêmicos")
    public Map<String, Object> contagionCritical(
            @RequestParam UUID portfolioId,
            @RequestParam(required = false, defaultValue = "10") int limit
    ) {
        var r = criticalNodes.execute(new GetCriticalNodesUseCase.Query(portfolioId, limit));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("portfolioId", r.portfolioId().toString());
        body.put("nodes", r.nodes());
        return body;
    }

    @GetMapping("/contagion/{simId}")
    @Operation(summary = "Resultado com perda por onda")
    public Map<String, Object> contagionGet(@PathVariable String simId) {
        var r = getContagion.execute(simId);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("simId", r.simId());
        body.put("status", r.status());
        body.put("portfolioId", r.portfolioId().toString());
        body.put("originNodeId", r.originNodeId());
        body.put("waves", r.waves());
        body.put("totalExpectedLoss", r.totalExpectedLoss());
        return body;
    }

    // --- F03 ---
    @PostMapping("/stress/run")
    @Operation(summary = "Estresse macro sobre agregados OLAP")
    public Map<String, Object> stressRun(@Valid @RequestBody PortfolioRequests.RunStressRequest req) {
        var r = runStress.execute(new RunStressUseCase.Command(
                req.portfolioId(),
                req.variables(),
                Boolean.TRUE.equals(req.compareBaseline())
        ));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("runId", r.runId());
        body.put("status", r.status());
        body.put("elapsedMs", r.elapsedMs());
        body.put("aggregateVersion", r.aggregateVersion());
        body.put("baselineNpl", r.baselineNpl());
        body.put("stressedNpl", r.stressedNpl());
        body.put("expectedLossDelta", r.expectedLossDelta());
        body.put("queued", r.queued());
        return body;
    }

    @GetMapping("/stress/scenarios")
    @Operation(summary = "Lista cenários PRESET/CUSTOM")
    public Map<String, Object> stressScenarios() {
        var r = listScenarios.execute();
        return Map.of("scenarios", r.scenarios());
    }

    @GetMapping("/stress/{runId}")
    @Operation(summary = "Consulta run de estresse")
    public Map<String, Object> stressGet(@PathVariable String runId) {
        var r = getStressRun.execute(runId);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("runId", r.runId());
        body.put("status", r.status());
        body.put("portfolioId", r.portfolioId().toString());
        body.put("aggregateVersion", r.aggregateVersion());
        body.put("baselineNpl", r.baselineNpl());
        body.put("stressedNpl", r.stressedNpl());
        body.put("expectedLossDelta", r.expectedLossDelta());
        return body;
    }

    // --- F04 ---
    @GetMapping("/concentration")
    @Operation(summary = "Posição vs limites por dimensão")
    public Map<String, Object> concentration(@RequestParam UUID portfolioId) {
        var r = concentration.execute(new GetConcentrationUseCase.Query(portfolioId));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("portfolioId", r.portfolioId().toString());
        body.put("dimensions", r.dimensions());
        return body;
    }

    @PostMapping("/limits")
    @Operation(summary = "Cadastra/atualiza limites")
    public ResponseEntity<Map<String, Object>> limits(@Valid @RequestBody PortfolioRequests.UpsertLimitRequest req) {
        var r = upsertLimit.execute(new UpsertLimitUseCase.Command(
                req.portfolioId(), req.dimension(), req.thresholdPct(), req.warnPct()
        ));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("limitId", r.limitId().toString());
        body.put("portfolioId", r.portfolioId().toString());
        body.put("dimension", r.dimension());
        body.put("thresholdPct", r.thresholdPct());
        body.put("warnPct", r.warnPct());
        return ResponseEntity.status(HttpStatus.CREATED).body(body);
    }

    @GetMapping("/alerts")
    @Operation(summary = "Alertas abertos/histórico")
    public Map<String, Object> alerts(
            @RequestParam UUID portfolioId,
            @RequestParam(required = false) String status
    ) {
        var r = listAlerts.execute(new ListAlertsUseCase.Query(portfolioId, status));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("portfolioId", r.portfolioId().toString());
        body.put("alerts", r.alerts());
        return body;
    }

    // --- F05 ---
    @GetMapping("/aggregates")
    @Operation(summary = "Agregados + metadados de frescor")
    public Map<String, Object> aggregates(@RequestParam UUID portfolioId) {
        var r = getAggregates.execute(new GetAggregatesUseCase.Query(portfolioId));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("portfolioId", r.portfolioId().toString());
        body.put("cubes", r.cubes());
        body.put("aggregateVersion", r.aggregateVersion());
        return body;
    }

    @PostMapping("/aggregates/refresh")
    @Operation(summary = "Refresh incremental ou FULL")
    public ResponseEntity<Map<String, Object>> aggregatesRefresh(
            @Valid @RequestBody PortfolioRequests.RefreshAggregatesRequest req
    ) {
        var r = refreshAggregates.execute(new RefreshAggregatesUseCase.Command(
                req.cubeName(), req.mode(), req.partitions()
        ));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("jobId", r.jobId());
        body.put("status", r.status());
        body.put("mode", r.mode());
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(body);
    }

    @GetMapping("/aggregates/freshness")
    @Operation(summary = "Idade vs SLA por cubo")
    public Map<String, Object> aggregatesFreshness() {
        var r = freshness.execute();
        return Map.of("cubes", r.cubes());
    }

    // --- F06 ---
    @PostMapping("/communities/detect")
    @Operation(summary = "Executa Louvain e materializa")
    public ResponseEntity<Map<String, Object>> communitiesDetect(
            @Valid @RequestBody PortfolioRequests.DetectCommunitiesRequest req
    ) {
        var r = detectCommunities.execute(new DetectCommunitiesUseCase.Command(
                req.portfolioId(),
                req.minCommunitySize() == null ? 5 : req.minCommunitySize(),
                req.algorithm()
        ));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("runId", r.runId());
        body.put("status", r.status());
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(body);
    }

    @GetMapping("/communities")
    @Operation(summary = "Lista comunidades ordenáveis")
    public Map<String, Object> communities(@RequestParam UUID portfolioId) {
        var r = listCommunities.execute(new ListCommunitiesUseCase.Query(portfolioId));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("portfolioId", r.portfolioId().toString());
        body.put("communities", r.communities());
        return body;
    }

    @GetMapping("/communities/{communityId}")
    @Operation(summary = "Detalhe + membros")
    public Map<String, Object> communityGet(@PathVariable String communityId) {
        var r = getCommunity.execute(communityId);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("communityId", r.communityId());
        body.put("label", r.label());
        body.put("totalExposure", r.totalExposure());
        body.put("memberCount", r.memberCount());
        body.put("members", r.members());
        return body;
    }

    // --- F07 ---
    @GetMapping("/snapshot")
    @Operation(summary = "Estado as-of date (time travel)")
    public Map<String, Object> snapshot(
            @RequestParam UUID portfolioId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        var r = getSnapshot.execute(new GetSnapshotUseCase.Query(portfolioId, date));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("asOfDate", r.asOfDate().toString());
        body.put("aggregateVersion", r.aggregateVersion());
        body.put("nodeCount", r.nodeCount());
        body.put("divergenceFlag", r.divergenceFlag());
        body.put("summary", r.summary());
        return body;
    }

    @PostMapping("/compare")
    @Operation(summary = "Compara dois instantes")
    public Map<String, Object> compare(@Valid @RequestBody PortfolioRequests.CompareSnapshotsRequest req) {
        var r = compareSnapshots.execute(new CompareSnapshotsUseCase.Command(
                req.portfolioId(), req.dateA(), req.dateB()
        ));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("dateA", r.dateA().toString());
        body.put("dateB", r.dateB().toString());
        body.put("exposureDelta", r.exposureDelta());
        body.put("nplDelta", r.nplDelta());
        body.put("details", r.details());
        return body;
    }

    @GetMapping("/timeline")
    @Operation(summary = "Eventos de impacto")
    public Map<String, Object> timeline(@RequestParam UUID portfolioId) {
        var r = timeline.execute(new GetTimelineUseCase.Query(portfolioId));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("portfolioId", r.portfolioId().toString());
        body.put("events", r.events());
        return body;
    }

    // --- F08 ---
    @PostMapping("/reports")
    @Operation(summary = "Gera dossiê PDF com premissas")
    public ResponseEntity<Map<String, Object>> reportsCreate(
            @Valid @RequestBody PortfolioRequests.CreateReportRequest req
    ) {
        List<CreateReportUseCase.Section> sections = req.sections() == null ? List.of()
                : req.sections().stream()
                .map(s -> new CreateReportUseCase.Section(s.analysisType(), s.analysisRef(), s.sortOrder()))
                .toList();
        var r = createReport.execute(new CreateReportUseCase.Command(
                req.portfolioId(), req.title(), req.watermarkTo(), sections
        ));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("reportId", r.reportId());
        body.put("status", r.status());
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(body);
    }

    @GetMapping("/reports/{reportId}")
    @Operation(summary = "Status + sumário executivo")
    public Map<String, Object> reportsGet(@PathVariable String reportId) {
        var r = getReport.execute(reportId);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("reportId", r.reportId());
        body.put("status", r.status());
        body.put("title", r.title());
        body.put("executiveSummary", r.executiveSummary());
        return body;
    }

    @GetMapping("/reports/{reportId}/download")
    @Operation(summary = "URL pré-assinada S3 (lab stub)")
    public Map<String, Object> reportsDownload(@PathVariable String reportId) {
        var r = downloadReport.download(reportId);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("reportId", r.reportId());
        body.put("downloadUrl", r.downloadUrl());
        body.put("expiresAt", r.expiresAt());
        return body;
    }
}
