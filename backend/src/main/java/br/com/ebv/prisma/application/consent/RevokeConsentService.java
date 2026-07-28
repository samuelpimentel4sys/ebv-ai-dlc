package br.com.ebv.prisma.application.consent;

import br.com.ebv.prisma.domain.consent.exception.ConsentNotFoundException;
import br.com.ebv.prisma.domain.consent.port.in.RevokeConsentUseCase;
import br.com.ebv.prisma.domain.consent.port.out.ConsentRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class RevokeConsentService implements RevokeConsentUseCase {

    private final ConsentRepositoryPort repo;

    public RevokeConsentService(ConsentRepositoryPort repo) {
        this.repo = repo;
    }

    @Override
    @Transactional
    public Result execute(Command command) {
        var existing = repo.findById(command.consentId())
                .orElseThrow(() -> new ConsentNotFoundException("consentimento não encontrado"));
        repo.save(new ConsentRepositoryPort.ConsentRecord(
                existing.consentId(), existing.documentoHash(), existing.purposeCode(), existing.sourceCode(),
                "REVOKED", existing.grantedAt(), Instant.now(), existing.validTo(),
                existing.channel(), existing.versionTermo()
        ));
        return new Result(existing.consentId(), "REVOKED");
    }
}
