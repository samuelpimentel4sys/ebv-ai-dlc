package br.com.ebv.prisma.domain.fairness.port.in;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface AnalyzeFairnessUseCase {

    record Window(LocalDate from, LocalDate to) {}

    record Command(
            String modelVersion,
            Window window,
            List<String> segments,
            List<String> metrics,
            String thresholdProfile
    ) {}

    record Result(
            UUID runId,
            String status,
            String modelVersion,
            String thresholdProfile,
            Instant submittedAt,
            Instant finishedAt,
            boolean alertOpened
    ) {}

    Result execute(Command command);
}
