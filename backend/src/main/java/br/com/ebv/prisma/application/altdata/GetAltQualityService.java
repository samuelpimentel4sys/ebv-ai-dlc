package br.com.ebv.prisma.application.altdata;

import br.com.ebv.prisma.domain.altdata.port.in.GetAltQualityUseCase;
import br.com.ebv.prisma.domain.altdata.port.out.AltDataRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GetAltQualityService implements GetAltQualityUseCase {

    private final AltDataRepositoryPort repo;

    public GetAltQualityService(AltDataRepositoryPort repo) { this.repo = repo; }

    @Override
    @Transactional(readOnly = true)
    public Result execute() {
        var items = repo.findRecent(20).stream()
                .map(b -> new Item(b.batchId(), b.partnerCode(), b.status(), b.errorRate()))
                .toList();
        return new Result(items);
    }
}
