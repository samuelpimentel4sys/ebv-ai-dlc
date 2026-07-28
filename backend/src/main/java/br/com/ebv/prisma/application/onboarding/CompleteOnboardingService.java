package br.com.ebv.prisma.application.onboarding;

import br.com.ebv.prisma.domain.credential.port.in.CreateCredentialUseCase;
import br.com.ebv.prisma.domain.onboarding.exception.OnboardingConflictException;
import br.com.ebv.prisma.domain.onboarding.exception.OnboardingNotFoundException;
import br.com.ebv.prisma.domain.onboarding.exception.OnboardingValidationException;
import br.com.ebv.prisma.domain.onboarding.port.in.CompleteOnboardingUseCase;
import br.com.ebv.prisma.domain.onboarding.port.out.OnboardingRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

@Service
public class CompleteOnboardingService implements CompleteOnboardingUseCase {

    public static final String CONTRACT_VERSION = "API-CREDITO-2026.07";

    private final OnboardingRepositoryPort onboardingRepo;
    private final CreateCredentialUseCase createCredential;

    public CompleteOnboardingService(OnboardingRepositoryPort onboardingRepo, CreateCredentialUseCase createCredential) {
        this.onboardingRepo = onboardingRepo;
        this.createCredential = createCredential;
    }

    @Override
    @Transactional
    public Result execute(Command command) {
        var existing = onboardingRepo.findById(command.id())
                .orElseThrow(() -> new OnboardingNotFoundException("Onboarding não encontrado: " + command.id()));
        if (!"VERIFIED".equals(existing.status())) {
            throw new OnboardingConflictException("Onboarding precisa estar VERIFIED para complete; status=" + existing.status());
        }
        if (!command.accepted()) {
            throw new OnboardingValidationException("accepted deve ser true");
        }
        if (command.contractVersion() == null || !CONTRACT_VERSION.equals(command.contractVersion())) {
            throw new OnboardingConflictException("contractVersion inválida");
        }
        String tenantId = "tenant-" + existing.cnpj();
        var cred = createCredential.execute(new CreateCredentialUseCase.Command(
                tenantId, List.of("credit.score.read"), "SANDBOX", 500
        ));
        Instant now = Instant.now();
        onboardingRepo.save(new OnboardingRepositoryPort.OnboardingRecord(
                existing.id(), existing.cnpj(), existing.legalName(), existing.representative(),
                "COMPLETED", tenantId, existing.createdAt(), now
        ));
        long duration = Duration.between(existing.createdAt(), now).getSeconds();
        return new Result(
                existing.id(),
                "COMPLETED",
                tenantId,
                new CredentialView(cred.id(), cred.clientId(), cred.secret(), cred.scopes(), cred.env()),
                duration
        );
    }
}
