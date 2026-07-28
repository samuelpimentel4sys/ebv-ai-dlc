package br.com.ebv.prisma.application.thinfile;

import br.com.ebv.prisma.domain.thinfile.port.in.GetThinfileDriftUseCase;
import br.com.ebv.prisma.domain.thinfile.port.out.ThinfileRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class GetThinfileDriftService implements GetThinfileDriftUseCase {

    private final ThinfileRepositoryPort repo;

    public GetThinfileDriftService(ThinfileRepositoryPort repo) { this.repo = repo; }

    @Override
    @Transactional(readOnly = true)
    public Result execute() {
        return repo.findLatestRun()
                .map(run -> {
                    var items = repo.findDriftByRun(run.runId()).stream()
                            .map(d -> new Item(d.featureName(), d.psi(), d.severity(), d.vulnerableSegment()))
                            .toList();
                    return new Result(items);
                })
                .orElseGet(() -> new Result(List.of()));
    }
}
