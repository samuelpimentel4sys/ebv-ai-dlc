package br.com.ebv.prisma.application.utilitylink;

import br.com.ebv.prisma.domain.utilitylink.exception.UtilityLinkNotFoundException;
import br.com.ebv.prisma.domain.utilitylink.port.in.UnlinkUtilityUseCase;
import br.com.ebv.prisma.domain.utilitylink.port.out.UtilityLinkRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class UnlinkUtilityService implements UnlinkUtilityUseCase {

    private final UtilityLinkRepositoryPort repo;

    public UnlinkUtilityService(UtilityLinkRepositoryPort repo) {
        this.repo = repo;
    }

    @Override
    @Transactional
    public Result execute(Command command) {
        var existing = repo.findById(command.linkId())
                .orElseThrow(() -> new UtilityLinkNotFoundException("vínculo não encontrado"));
        repo.save(new UtilityLinkRepositoryPort.LinkRecord(
                existing.linkId(), existing.documentoHash(), existing.partnerCode(), existing.accountRef(),
                existing.utilityType(), "UNLINKED", existing.linkedAt(), Instant.now()
        ));
        return new Result(existing.linkId(), "UNLINKED");
    }
}
