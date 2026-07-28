package br.com.ebv.prisma.application.identity;

import br.com.ebv.prisma.domain.identity.port.in.ListCandidatesUseCase;
import br.com.ebv.prisma.domain.identity.port.out.GoldenRecordRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class ListCandidatesService implements ListCandidatesUseCase {

    private final GoldenRecordRepositoryPort repository;

    public ListCandidatesService(GoldenRecordRepositoryPort repository) {
        this.repository = repository;
    }

    @Override
    public List<CandidateView> execute() {
        return repository.listPendingCandidates().stream()
                .map(c -> new CandidateView(c.id(), c.left(), c.right(), c.confidence(), c.status()))
                .toList();
    }
}
