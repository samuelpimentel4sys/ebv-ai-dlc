package br.com.ebv.prisma.application.identity;

import br.com.ebv.prisma.domain.identity.exception.GoldenRecordNotFoundException;
import br.com.ebv.prisma.domain.identity.model.DocumentoCanonico;
import br.com.ebv.prisma.domain.identity.model.GoldenRecord;
import br.com.ebv.prisma.domain.identity.port.in.GetIdentityUseCase;
import br.com.ebv.prisma.domain.identity.port.out.GoldenRecordRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class GetIdentityService implements GetIdentityUseCase {

    private final GoldenRecordRepositoryPort repository;

    public GetIdentityService(GoldenRecordRepositoryPort repository) {
        this.repository = repository;
    }

    @Override
    public GoldenRecord execute(String documento) {
        DocumentoCanonico doc = new DocumentoCanonico(documento);
        return repository.findActiveByDocumento(doc)
                .orElseThrow(() -> new GoldenRecordNotFoundException(doc.value()));
    }
}
