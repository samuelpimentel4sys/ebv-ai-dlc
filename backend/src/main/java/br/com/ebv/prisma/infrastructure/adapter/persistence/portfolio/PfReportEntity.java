package br.com.ebv.prisma.infrastructure.adapter.persistence.portfolio;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "tb_pf_report")
public class PfReportEntity {
    @Id @Column(name = "report_id", length = 40) private String reportId;
    @Column(name = "portfolio_id", nullable = false) private UUID portfolioId;
    @Column(nullable = false, length = 200) private String title;
    @Column(name = "watermark_to", length = 120) private String watermarkTo;
    @Column(nullable = false, length = 20) private String status;
    @Column(name = "sections_json") private String sectionsJson;
    @Column(name = "summary_json") private String summaryJson;
    @Column(name = "download_url", length = 500) private String downloadUrl;
    @Column(name = "created_at", nullable = false) private OffsetDateTime createdAt;
    @Column(name = "finished_at") private OffsetDateTime finishedAt;
    public String getReportId() { return reportId; }
    public void setReportId(String v) { reportId = v; }
    public UUID getPortfolioId() { return portfolioId; }
    public void setPortfolioId(UUID v) { portfolioId = v; }
    public String getTitle() { return title; }
    public void setTitle(String v) { title = v; }
    public String getWatermarkTo() { return watermarkTo; }
    public void setWatermarkTo(String v) { watermarkTo = v; }
    public String getStatus() { return status; }
    public void setStatus(String v) { status = v; }
    public String getSectionsJson() { return sectionsJson; }
    public void setSectionsJson(String v) { sectionsJson = v; }
    public String getSummaryJson() { return summaryJson; }
    public void setSummaryJson(String v) { summaryJson = v; }
    public String getDownloadUrl() { return downloadUrl; }
    public void setDownloadUrl(String v) { downloadUrl = v; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime v) { createdAt = v; }
    public OffsetDateTime getFinishedAt() { return finishedAt; }
    public void setFinishedAt(OffsetDateTime v) { finishedAt = v; }
}
