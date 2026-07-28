package br.com.ebv.prisma.application.credential;

import br.com.ebv.prisma.domain.credential.exception.CredentialNotFoundException;
import br.com.ebv.prisma.domain.credential.port.in.RevokeCredentialUseCase;
import br.com.ebv.prisma.domain.credential.port.out.CredentialRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RevokeCredentialService implements RevokeCredentialUseCase {

    private final CredentialRepositoryPort credentialRepo;

    public RevokeCredentialService(CredentialRepositoryPort credentialRepo) {
        this.credentialRepo = credentialRepo;
    }

    @Override
    @Transactional
    public void execute(Command command) {
        var existing = credentialRepo.findById(command.id())
                .orElseThrow(() -> new CredentialNotFoundException("Credencial não encontrada: " + command.id()));
        credentialRepo.save(new CredentialRepositoryPort.CredentialRecord(
                existing.id(),
                existing.clientId(),
                existing.secretHash(),
                existing.scopesJson(),
                existing.env(),
                "REVOKED",
                existing.rateLimit(),
                existing.tenantId(),
                existing.createdAt(),
                existing.rotatedAt()
        ));
    }
}
