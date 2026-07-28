package br.com.ebv.prisma.application.consent;

import br.com.ebv.prisma.domain.consent.exception.ConsentValidationException;
import br.com.ebv.prisma.domain.consent.port.in.ListConsentsUseCase;
import br.com.ebv.prisma.domain.consent.port.out.ConsentRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ListConsentsService implements ListConsentsUseCase {

    private final ConsentRepositoryPort repo;

    public ListConsentsService(ConsentRepositoryPort repo) {
        this.repo = repo;
    }

    @Override
    @Transactional(readOnly = true)
    public Result execute(Query query) {
        if (query.documento() == null || query.documento().isBlank()) {
            throw new ConsentValidationException("documento obrigatório");
        }
        String hash = RegisterConsentService.sha256(query.documento().trim());
        var items = repo.findByDocumentoHash(hash).stream()
                .map(r -> new Item(r.consentId(), r.purposeCode(), r.sourceCode(), r.status()))
                .toList();
        return new Result(query.documento(), items);
    }
}
