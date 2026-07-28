package br.com.ebv.prisma.application.portfolio;

import br.com.ebv.prisma.domain.portfolio.exception.PortfolioValidationException;
import br.com.ebv.prisma.domain.portfolio.port.in.AggregatesUseCases.GetAggregatesUseCase;
import br.com.ebv.prisma.domain.portfolio.port.in.AggregatesUseCases.GetFreshnessUseCase;
import br.com.ebv.prisma.domain.portfolio.port.in.AggregatesUseCases.RefreshAggregatesUseCase;
import br.com.ebv.prisma.domain.portfolio.port.out.PortfolioRepositoryPort;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class AggregatesLabService implements GetAggregatesUseCase, RefreshAggregatesUseCase, GetFreshnessUseCase {

    private final PortfolioRepositoryPort repo;
    private final ObjectMapper mapper;

    public AggregatesLabService(PortfolioRepositoryPort repo, ObjectMapper mapper) {
        this.repo = repo;
        this.mapper = mapper;
    }

    @Override
    @Transactional(readOnly = true)
    public GetAggregatesUseCase.Result execute(GetAggregatesUseCase.Query query) {
        if (query.portfolioId() == null) throw new PortfolioValidationException("portfolioId obrigatório");
        Instant now = Instant.now();
        List<GetAggregatesUseCase.Cube> cubes = repo.listCubeMeta().stream().map(c -> {
            Instant last = c.lastRefreshAt() == null ? now.minus(Duration.ofHours(2)) : c.lastRefreshAt();
            int age = (int) Duration.between(last, now).toMinutes();
            return new GetAggregatesUseCase.Cube(c.cubeName(), last, c.status(), age);
        }).toList();
        if (cubes.isEmpty()) {
            cubes = List.of(new GetAggregatesUseCase.Cube("exposure_by_sector", now.minus(Duration.ofMinutes(30)), "FRESH", 30));
        }
        return new GetAggregatesUseCase.Result(query.portfolioId(), cubes, "agg-lab-" + now);
    }

    @Override
    @Transactional
    public RefreshAggregatesUseCase.Result execute(RefreshAggregatesUseCase.Command command) {
        if (command.cubeName() == null || command.cubeName().isBlank()) {
            throw new PortfolioValidationException("cubeName obrigatório");
        }
        String mode = command.mode() == null || command.mode().isBlank() ? "INCREMENTAL" : command.mode().toUpperCase();
        if (!mode.equals("INCREMENTAL") && !mode.equals("FULL")) {
            throw new PortfolioValidationException("mode deve ser INCREMENTAL ou FULL");
        }
        String jobId = "job-" + UUID.randomUUID().toString().substring(0, 8);
        String parts;
        try {
            parts = mapper.writeValueAsString(command.partitions() == null ? List.of() : command.partitions());
        } catch (Exception e) {
            parts = "[]";
        }
        Instant now = Instant.now();
        repo.saveCubeJob(new PortfolioRepositoryPort.CubeJobRecord(
                jobId, command.cubeName(), mode, "RUNNING", parts, now, null
        ));
        repo.saveCubeMeta(new PortfolioRepositoryPort.CubeMetaRecord(
                command.cubeName(), now, 60, "REFRESHING"
        ));
        return new RefreshAggregatesUseCase.Result(jobId, "RUNNING", mode);
    }

    @Override
    @Transactional(readOnly = true)
    public GetFreshnessUseCase.Result execute() {
        Instant now = Instant.now();
        List<GetFreshnessUseCase.CubeFreshness> cubes = repo.listCubeMeta().stream().map(c -> {
            Instant last = c.lastRefreshAt() == null ? now.minus(Duration.ofHours(2)) : c.lastRefreshAt();
            int age = (int) Duration.between(last, now).toMinutes();
            boolean ok = age <= c.freshnessSlaMinutes();
            return new GetFreshnessUseCase.CubeFreshness(
                    c.cubeName(), age, c.freshnessSlaMinutes(), ok, ok ? "FRESH" : "STALE");
        }).toList();
        if (cubes.isEmpty()) {
            cubes = List.of(new GetFreshnessUseCase.CubeFreshness("exposure_by_sector", 30, 60, true, "FRESH"));
        }
        return new GetFreshnessUseCase.Result(cubes);
    }
}
