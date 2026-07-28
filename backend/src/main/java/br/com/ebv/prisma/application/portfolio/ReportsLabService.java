package br.com.ebv.prisma.application.portfolio;

import br.com.ebv.prisma.domain.portfolio.exception.PortfolioNotFoundException;
import br.com.ebv.prisma.domain.portfolio.exception.PortfolioValidationException;
import br.com.ebv.prisma.domain.portfolio.port.in.ReportsUseCases.CreateReportUseCase;
import br.com.ebv.prisma.domain.portfolio.port.in.ReportsUseCases.DownloadReportUseCase;
import br.com.ebv.prisma.domain.portfolio.port.in.ReportsUseCases.GetReportUseCase;
import br.com.ebv.prisma.domain.portfolio.port.out.PortfolioRepositoryPort;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class ReportsLabService implements CreateReportUseCase, GetReportUseCase, DownloadReportUseCase {

    private final PortfolioRepositoryPort repo;
    private final ObjectMapper mapper;

    public ReportsLabService(PortfolioRepositoryPort repo, ObjectMapper mapper) {
        this.repo = repo;
        this.mapper = mapper;
    }

    @Override
    @Transactional
    public CreateReportUseCase.Result execute(CreateReportUseCase.Command command) {
        if (command.portfolioId() == null) throw new PortfolioValidationException("portfolioId obrigatório");
        if (command.title() == null || command.title().isBlank()) {
            throw new PortfolioValidationException("title obrigatório");
        }
        if (command.sections() != null) {
            for (CreateReportUseCase.Section s : command.sections()) {
                if ("CONTAGION".equalsIgnoreCase(s.analysisType()) || "STRESS".equalsIgnoreCase(s.analysisType())) {
                    if (s.analysisRef() == null || s.analysisRef().isBlank()) {
                        throw new PortfolioValidationException("NOT_EXPORTABLE: analysisRef obrigatório para " + s.analysisType());
                    }
                }
            }
        }
        String reportId = "rep-" + UUID.randomUUID().toString().substring(0, 8);
        String sectionsJson;
        try {
            sectionsJson = mapper.writeValueAsString(command.sections() == null ? List.of() : command.sections());
        } catch (Exception e) {
            sectionsJson = "[]";
        }
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("headline", "Dossiê executivo lab — " + command.title());
        summary.put("sections", command.sections() == null ? 0 : command.sections().size());
        String summaryJson;
        try {
            summaryJson = mapper.writeValueAsString(summary);
        } catch (Exception e) {
            summaryJson = "{}";
        }
        Instant now = Instant.now();
        repo.saveReport(new PortfolioRepositoryPort.ReportRecord(
                reportId, command.portfolioId(), command.title(), command.watermarkTo(),
                "READY", sectionsJson, summaryJson,
                "https://lab.local/portfolio/reports/" + reportId + ".pdf",
                now, now
        ));
        return new CreateReportUseCase.Result(reportId, "GENERATING");
    }

    @Override
    @Transactional(readOnly = true)
    public GetReportUseCase.Result execute(String reportId) {
        var r = repo.findReport(reportId)
                .orElseThrow(() -> new PortfolioNotFoundException("Relatório não encontrado: " + reportId));
        Map<String, Object> summary;
        try {
            summary = mapper.readValue(r.summaryJson() == null ? "{}" : r.summaryJson(),
                    new com.fasterxml.jackson.core.type.TypeReference<>() {});
        } catch (Exception e) {
            summary = Map.of("headline", r.title());
        }
        return new GetReportUseCase.Result(r.reportId(), r.status(), r.title(), summary);
    }

    @Override
    @Transactional(readOnly = true)
    public DownloadReportUseCase.Result download(String reportId) {
        var r = repo.findReport(reportId)
                .orElseThrow(() -> new PortfolioNotFoundException("Relatório não encontrado: " + reportId));
        String url = r.downloadUrl() != null ? r.downloadUrl()
                : "https://lab.local/portfolio/reports/" + reportId + ".pdf";
        return new DownloadReportUseCase.Result(
                r.reportId(), url, Instant.now().plus(15, ChronoUnit.MINUTES).toString());
    }
}
