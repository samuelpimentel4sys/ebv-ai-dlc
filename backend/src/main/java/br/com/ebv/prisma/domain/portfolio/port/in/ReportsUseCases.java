package br.com.ebv.prisma.domain.portfolio.port.in;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public final class ReportsUseCases {
    private ReportsUseCases() {}

    public interface CreateReportUseCase {
        record Section(String analysisType, String analysisRef, int sortOrder) {}
        record Command(UUID portfolioId, String title, String watermarkTo, List<Section> sections) {}
        record Result(String reportId, String status) {}
        Result execute(Command command);
    }

    public interface GetReportUseCase {
        record Result(String reportId, String status, String title, Map<String, Object> executiveSummary) {}
        Result execute(String reportId);
    }

    public interface DownloadReportUseCase {
        record Result(String reportId, String downloadUrl, String expiresAt) {}
        Result download(String reportId);
    }
}
