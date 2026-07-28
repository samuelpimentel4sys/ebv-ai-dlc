package br.com.ebv.prisma.application.altdata;

import br.com.ebv.prisma.domain.altdata.port.in.GetAltCoverageUseCase;
import br.com.ebv.prisma.domain.altdata.port.out.AltDataRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class GetAltCoverageService implements GetAltCoverageUseCase {

    private final AltDataRepositoryPort repo;

    public GetAltCoverageService(AltDataRepositoryPort repo) { this.repo = repo; }

    @Override
    @Transactional(readOnly = true)
    public Result execute() {
        // lab stub aggregates
        var partners = repo.findRecent(50).stream().map(AltDataRepositoryPort.BatchRecord::partnerCode).distinct().toList();
        if (partners.isEmpty()) {
            return new Result(List.of(new Item("CEMIG-MG", "MG", 12000L)));
        }
        return new Result(partners.stream().map(p -> new Item(p, "BR", 1000L)).toList());
    }
}
