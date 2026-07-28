package br.com.ebv.prisma.application.utilitylink;

import br.com.ebv.prisma.domain.utilitylink.exception.UtilityLinkValidationException;
import br.com.ebv.prisma.domain.utilitylink.port.in.ListUtilityLinksUseCase;
import br.com.ebv.prisma.domain.utilitylink.port.out.UtilityLinkRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ListUtilityLinksService implements ListUtilityLinksUseCase {

    private final UtilityLinkRepositoryPort repo;

    public ListUtilityLinksService(UtilityLinkRepositoryPort repo) {
        this.repo = repo;
    }

    @Override
    @Transactional(readOnly = true)
    public Result execute(Query query) {
        if (query.documento() == null || query.documento().isBlank()) {
            throw new UtilityLinkValidationException("documento obrigatório");
        }
        String hash = LinkUtilityService.sha256(query.documento().trim());
        var links = repo.findByDocumentoHash(hash).stream()
                .map(r -> new Item(r.linkId(), r.partnerCode(), r.accountRef(), r.utilityType(), r.status()))
                .toList();
        return new Result(links);
    }
}
