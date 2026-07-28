package br.com.ebv.prisma.application.portfolio;

import br.com.ebv.prisma.domain.portfolio.exception.PortfolioNotFoundException;
import br.com.ebv.prisma.domain.portfolio.exception.PortfolioValidationException;
import br.com.ebv.prisma.domain.portfolio.port.in.CommunitiesUseCases.DetectCommunitiesUseCase;
import br.com.ebv.prisma.domain.portfolio.port.in.CommunitiesUseCases.GetCommunityUseCase;
import br.com.ebv.prisma.domain.portfolio.port.in.CommunitiesUseCases.ListCommunitiesUseCase;
import br.com.ebv.prisma.domain.portfolio.port.out.PortfolioRepositoryPort;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class CommunitiesLabService implements DetectCommunitiesUseCase, ListCommunitiesUseCase, GetCommunityUseCase {

    private final PortfolioRepositoryPort repo;
    private final ObjectMapper mapper;

    public CommunitiesLabService(PortfolioRepositoryPort repo, ObjectMapper mapper) {
        this.repo = repo;
        this.mapper = mapper;
    }

    @Override
    @Transactional
    public DetectCommunitiesUseCase.Result execute(DetectCommunitiesUseCase.Command command) {
        if (command.portfolioId() == null) throw new PortfolioValidationException("portfolioId obrigatório");
        int min = command.minCommunitySize() <= 0 ? 5 : command.minCommunitySize();
        String algo = command.algorithm() == null || command.algorithm().isBlank() ? "LOUVAIN" : command.algorithm();
        String runId = "comm-run-" + UUID.randomUUID().toString().substring(0, 6);
        Instant now = Instant.now();
        repo.saveCommunityRun(new PortfolioRepositoryPort.CommunityRunRecord(
                runId, command.portfolioId(), algo, min, "COMPLETED", now, now
        ));
        String membersJson;
        try {
            membersJson = mapper.writeValueAsString(List.of("n-1001", "n-2044", "n-3002"));
        } catch (Exception e) {
            membersJson = "[]";
        }
        String communityId = "comm-" + UUID.randomUUID().toString().substring(0, 6);
        repo.saveCommunity(new PortfolioRepositoryPort.CommunityRecord(
                communityId, runId, command.portfolioId(), "Cluster lab A",
                new BigDecimal("3200000.00"), 3, membersJson
        ));
        return new DetectCommunitiesUseCase.Result(runId, "RUNNING");
    }

    @Override
    @Transactional(readOnly = true)
    public ListCommunitiesUseCase.Result execute(ListCommunitiesUseCase.Query query) {
        if (query.portfolioId() == null) throw new PortfolioValidationException("portfolioId obrigatório");
        var list = repo.listCommunities(query.portfolioId()).stream()
                .sorted((a, b) -> b.totalExposure().compareTo(a.totalExposure()))
                .map(c -> new ListCommunitiesUseCase.Community(
                        c.communityId(), c.label(), c.totalExposure(), c.memberCount()))
                .toList();
        if (list.isEmpty()) {
            list = List.of(new ListCommunitiesUseCase.Community(
                    "comm-lab", "Cluster lab A", new BigDecimal("3200000.00"), 3));
        }
        return new ListCommunitiesUseCase.Result(query.portfolioId(), list);
    }

    @Override
    @Transactional(readOnly = true)
    public GetCommunityUseCase.Result execute(String communityId) {
        var c = repo.findCommunity(communityId)
                .orElseThrow(() -> new PortfolioNotFoundException("Comunidade não encontrada: " + communityId));
        List<String> members;
        try {
            members = mapper.readValue(c.membersJson() == null ? "[]" : c.membersJson(), new TypeReference<>() {});
        } catch (Exception e) {
            members = List.of();
        }
        return new GetCommunityUseCase.Result(
                c.communityId(), c.label(), c.totalExposure(), c.memberCount(), members
        );
    }
}
