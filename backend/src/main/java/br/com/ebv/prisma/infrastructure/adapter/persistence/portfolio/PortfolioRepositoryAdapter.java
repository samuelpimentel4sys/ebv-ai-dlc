package br.com.ebv.prisma.infrastructure.adapter.persistence.portfolio;

import br.com.ebv.prisma.domain.portfolio.port.out.PortfolioRepositoryPort;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
@Transactional
public class PortfolioRepositoryAdapter implements PortfolioRepositoryPort {

    private final PfGraphFilterJpaRepository graphFilterJpa;
    private final PfContagionSimJpaRepository contagionJpa;
    private final PfStressScenarioJpaRepository stressScenarioJpa;
    private final PfStressRunJpaRepository stressRunJpa;
    private final PfLimitJpaRepository limitJpa;
    private final PfAlertJpaRepository alertJpa;
    private final PfCubeMetaJpaRepository cubeMetaJpa;
    private final PfCubeJobJpaRepository cubeJobJpa;
    private final PfCommunityRunJpaRepository communityRunJpa;
    private final PfCommunityJpaRepository communityJpa;
    private final PfSnapshotJpaRepository snapshotJpa;
    private final PfTimelineEventJpaRepository timelineJpa;
    private final PfReportJpaRepository reportJpa;

    public PortfolioRepositoryAdapter(
            PfGraphFilterJpaRepository graphFilterJpa,
            PfContagionSimJpaRepository contagionJpa,
            PfStressScenarioJpaRepository stressScenarioJpa,
            PfStressRunJpaRepository stressRunJpa,
            PfLimitJpaRepository limitJpa,
            PfAlertJpaRepository alertJpa,
            PfCubeMetaJpaRepository cubeMetaJpa,
            PfCubeJobJpaRepository cubeJobJpa,
            PfCommunityRunJpaRepository communityRunJpa,
            PfCommunityJpaRepository communityJpa,
            PfSnapshotJpaRepository snapshotJpa,
            PfTimelineEventJpaRepository timelineJpa,
            PfReportJpaRepository reportJpa
    ) {
        this.graphFilterJpa = graphFilterJpa;
        this.contagionJpa = contagionJpa;
        this.stressScenarioJpa = stressScenarioJpa;
        this.stressRunJpa = stressRunJpa;
        this.limitJpa = limitJpa;
        this.alertJpa = alertJpa;
        this.cubeMetaJpa = cubeMetaJpa;
        this.cubeJobJpa = cubeJobJpa;
        this.communityRunJpa = communityRunJpa;
        this.communityJpa = communityJpa;
        this.snapshotJpa = snapshotJpa;
        this.timelineJpa = timelineJpa;
        this.reportJpa = reportJpa;
    }

    private static OffsetDateTime odt(java.time.Instant i) {
        return i == null ? null : OffsetDateTime.ofInstant(i, ZoneOffset.UTC);
    }

    private static java.time.Instant inst(OffsetDateTime o) {
        return o == null ? null : o.toInstant();
    }

    @Override
    public void saveGraphFilter(GraphFilterRecord r) {
        PfGraphFilterEntity e = new PfGraphFilterEntity();
        e.setFilterId(r.filterId());
        e.setPortfolioId(r.portfolioId());
        e.setLod(r.lod());
        e.setMaxNodes(r.maxNodes());
        e.setCriteriaJson(r.criteriaJson());
        e.setCreatedAt(odt(r.createdAt()));
        graphFilterJpa.save(e);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<GraphFilterRecord> findGraphFilter(UUID filterId) {
        return graphFilterJpa.findById(filterId).map(e -> new GraphFilterRecord(
                e.getFilterId(), e.getPortfolioId(), e.getLod(), e.getMaxNodes(),
                e.getCriteriaJson(), inst(e.getCreatedAt())));
    }

    @Override
    public void saveContagion(ContagionSimRecord r) {
        PfContagionSimEntity e = new PfContagionSimEntity();
        e.setSimId(r.simId());
        e.setPortfolioId(r.portfolioId());
        e.setOriginNodeId(r.originNodeId());
        e.setTransmissionFactor(r.transmissionFactor());
        e.setMaxWaves(r.maxWaves());
        e.setStatus(r.status());
        e.setPremisesJson(r.premisesJson());
        e.setResultJson(r.resultJson());
        e.setCreatedAt(odt(r.createdAt()));
        e.setFinishedAt(odt(r.finishedAt()));
        contagionJpa.save(e);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<ContagionSimRecord> findContagion(String simId) {
        return contagionJpa.findById(simId).map(e -> new ContagionSimRecord(
                e.getSimId(), e.getPortfolioId(), e.getOriginNodeId(), e.getTransmissionFactor(),
                e.getMaxWaves(), e.getStatus(), e.getPremisesJson(), e.getResultJson(),
                inst(e.getCreatedAt()), inst(e.getFinishedAt())));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ContagionSimRecord> listContagionByPortfolio(UUID portfolioId) {
        return contagionJpa.findByPortfolioId(portfolioId).stream()
                .map(e -> new ContagionSimRecord(
                        e.getSimId(), e.getPortfolioId(), e.getOriginNodeId(), e.getTransmissionFactor(),
                        e.getMaxWaves(), e.getStatus(), e.getPremisesJson(), e.getResultJson(),
                        inst(e.getCreatedAt()), inst(e.getFinishedAt())))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<StressScenarioRecord> listStressScenarios() {
        return stressScenarioJpa.findAll().stream()
                .map(e -> new StressScenarioRecord(
                        e.getScenarioId(), e.getCode(), e.getKind(), e.getLabel(), e.getVariablesJson()))
                .toList();
    }

    @Override
    public void saveStressRun(StressRunRecord r) {
        PfStressRunEntity e = new PfStressRunEntity();
        e.setRunId(r.runId());
        e.setPortfolioId(r.portfolioId());
        e.setScenarioId(r.scenarioId());
        e.setStatus(r.status());
        e.setVariablesJson(r.variablesJson());
        e.setResultJson(r.resultJson());
        e.setAggregateVersion(r.aggregateVersion());
        e.setCreatedAt(odt(r.createdAt()));
        e.setFinishedAt(odt(r.finishedAt()));
        stressRunJpa.save(e);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<StressRunRecord> findStressRun(String runId) {
        return stressRunJpa.findById(runId).map(e -> new StressRunRecord(
                e.getRunId(), e.getPortfolioId(), e.getScenarioId(), e.getStatus(),
                e.getVariablesJson(), e.getResultJson(), e.getAggregateVersion(),
                inst(e.getCreatedAt()), inst(e.getFinishedAt())));
    }

    @Override
    public void saveLimit(LimitRecord r) {
        Optional<PfLimitEntity> existing = limitJpa.findByPortfolioIdAndDimension(r.portfolioId(), r.dimension());
        PfLimitEntity e = existing.orElseGet(PfLimitEntity::new);
        if (e.getLimitId() == null) e.setLimitId(r.limitId());
        e.setPortfolioId(r.portfolioId());
        e.setDimension(r.dimension());
        e.setThresholdPct(r.thresholdPct());
        e.setWarnPct(r.warnPct());
        e.setUpdatedAt(odt(r.updatedAt()));
        limitJpa.save(e);
    }

    @Override
    @Transactional(readOnly = true)
    public List<LimitRecord> listLimits(UUID portfolioId) {
        return limitJpa.findByPortfolioId(portfolioId).stream()
                .map(e -> new LimitRecord(
                        e.getLimitId(), e.getPortfolioId(), e.getDimension(),
                        e.getThresholdPct(), e.getWarnPct(), inst(e.getUpdatedAt())))
                .toList();
    }

    @Override
    public void saveAlert(AlertRecord r) {
        PfAlertEntity e = new PfAlertEntity();
        e.setAlertId(r.alertId());
        e.setPortfolioId(r.portfolioId());
        e.setDimension(r.dimension());
        e.setDimKey(r.dimKey());
        e.setSeverity(r.severity());
        e.setStatus(r.status());
        e.setMessage(r.message());
        e.setCreatedAt(odt(r.createdAt()));
        alertJpa.save(e);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AlertRecord> listAlerts(UUID portfolioId) {
        return alertJpa.findByPortfolioIdOrderByCreatedAtDesc(portfolioId).stream()
                .map(e -> new AlertRecord(
                        e.getAlertId(), e.getPortfolioId(), e.getDimension(), e.getDimKey(),
                        e.getSeverity(), e.getStatus(), e.getMessage(), inst(e.getCreatedAt())))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CubeMetaRecord> listCubeMeta() {
        return cubeMetaJpa.findAll().stream()
                .map(e -> new CubeMetaRecord(
                        e.getCubeName(), inst(e.getLastRefreshAt()), e.getFreshnessSlaMinutes(), e.getStatus()))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<CubeMetaRecord> findCubeMeta(String cubeName) {
        return cubeMetaJpa.findById(cubeName).map(e -> new CubeMetaRecord(
                e.getCubeName(), inst(e.getLastRefreshAt()), e.getFreshnessSlaMinutes(), e.getStatus()));
    }

    @Override
    public void saveCubeMeta(CubeMetaRecord r) {
        PfCubeMetaEntity e = cubeMetaJpa.findById(r.cubeName()).orElseGet(PfCubeMetaEntity::new);
        e.setCubeName(r.cubeName());
        e.setLastRefreshAt(odt(r.lastRefreshAt()));
        e.setFreshnessSlaMinutes(r.freshnessSlaMinutes());
        e.setStatus(r.status());
        cubeMetaJpa.save(e);
    }

    @Override
    public void saveCubeJob(CubeJobRecord r) {
        PfCubeJobEntity e = new PfCubeJobEntity();
        e.setJobId(r.jobId());
        e.setCubeName(r.cubeName());
        e.setMode(r.mode());
        e.setStatus(r.status());
        e.setPartitionsJson(r.partitionsJson());
        e.setCreatedAt(odt(r.createdAt()));
        e.setFinishedAt(odt(r.finishedAt()));
        cubeJobJpa.save(e);
    }

    @Override
    public void saveCommunityRun(CommunityRunRecord r) {
        PfCommunityRunEntity e = new PfCommunityRunEntity();
        e.setRunId(r.runId());
        e.setPortfolioId(r.portfolioId());
        e.setAlgorithm(r.algorithm());
        e.setMinCommunitySize(r.minCommunitySize());
        e.setStatus(r.status());
        e.setCreatedAt(odt(r.createdAt()));
        e.setFinishedAt(odt(r.finishedAt()));
        communityRunJpa.save(e);
    }

    @Override
    public void saveCommunity(CommunityRecord r) {
        PfCommunityEntity e = new PfCommunityEntity();
        e.setCommunityId(r.communityId());
        e.setRunId(r.runId());
        e.setPortfolioId(r.portfolioId());
        e.setLabel(r.label());
        e.setTotalExposure(r.totalExposure());
        e.setMemberCount(r.memberCount());
        e.setMembersJson(r.membersJson());
        communityJpa.save(e);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CommunityRecord> listCommunities(UUID portfolioId) {
        return communityJpa.findByPortfolioId(portfolioId).stream()
                .map(e -> new CommunityRecord(
                        e.getCommunityId(), e.getRunId(), e.getPortfolioId(), e.getLabel(),
                        e.getTotalExposure(), e.getMemberCount(), e.getMembersJson()))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<CommunityRecord> findCommunity(String communityId) {
        return communityJpa.findById(communityId).map(e -> new CommunityRecord(
                e.getCommunityId(), e.getRunId(), e.getPortfolioId(), e.getLabel(),
                e.getTotalExposure(), e.getMemberCount(), e.getMembersJson()));
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<SnapshotRecord> findSnapshot(UUID portfolioId, LocalDate asOf) {
        return snapshotJpa.findByPortfolioIdAndAsOfDate(portfolioId, asOf).map(e -> new SnapshotRecord(
                e.getSnapshotId(), e.getPortfolioId(), e.getAsOfDate(), e.getAggregateVersion(),
                e.getSummaryJson(), e.getNodeCount(), e.isDivergenceFlag()));
    }

    @Override
    public void saveSnapshot(SnapshotRecord r) {
        PfSnapshotEntity e = new PfSnapshotEntity();
        e.setSnapshotId(r.snapshotId());
        e.setPortfolioId(r.portfolioId());
        e.setAsOfDate(r.asOfDate());
        e.setAggregateVersion(r.aggregateVersion());
        e.setSummaryJson(r.summaryJson());
        e.setNodeCount(r.nodeCount());
        e.setDivergenceFlag(r.divergenceFlag());
        snapshotJpa.save(e);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TimelineEventRecord> listTimeline(UUID portfolioId) {
        return timelineJpa.findByPortfolioIdOrderByEventAtDesc(portfolioId).stream()
                .map(e -> new TimelineEventRecord(
                        e.getEventId(), e.getPortfolioId(), inst(e.getEventAt()),
                        e.getEventType(), e.getImpactJson(), e.getLabel()))
                .toList();
    }

    @Override
    public void saveReport(ReportRecord r) {
        PfReportEntity e = new PfReportEntity();
        e.setReportId(r.reportId());
        e.setPortfolioId(r.portfolioId());
        e.setTitle(r.title());
        e.setWatermarkTo(r.watermarkTo());
        e.setStatus(r.status());
        e.setSectionsJson(r.sectionsJson());
        e.setSummaryJson(r.summaryJson());
        e.setDownloadUrl(r.downloadUrl());
        e.setCreatedAt(odt(r.createdAt()));
        e.setFinishedAt(odt(r.finishedAt()));
        reportJpa.save(e);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<ReportRecord> findReport(String reportId) {
        return reportJpa.findById(reportId).map(e -> new ReportRecord(
                e.getReportId(), e.getPortfolioId(), e.getTitle(), e.getWatermarkTo(), e.getStatus(),
                e.getSectionsJson(), e.getSummaryJson(), e.getDownloadUrl(),
                inst(e.getCreatedAt()), inst(e.getFinishedAt())));
    }
}
