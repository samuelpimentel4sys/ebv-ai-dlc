package br.com.ebv.prisma.application.onboarding;

import br.com.ebv.prisma.domain.onboarding.exception.OnboardingConflictException;
import br.com.ebv.prisma.domain.onboarding.exception.OnboardingNotFoundException;
import br.com.ebv.prisma.domain.onboarding.port.in.VerifyOnboardingUseCase;
import br.com.ebv.prisma.domain.onboarding.port.out.OnboardingRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class VerifyOnboardingService implements VerifyOnboardingUseCase {

    private final OnboardingRepositoryPort onboardingRepo;

    public VerifyOnboardingService(OnboardingRepositoryPort onboardingRepo) {
        this.onboardingRepo = onboardingRepo;
    }

    @Override
    @Transactional
    public Result execute(Command command) {
        var existing = onboardingRepo.findById(command.id())
                .orElseThrow(() -> new OnboardingNotFoundException("Onboarding não encontrado: " + command.id()));
        if (!"STARTED".equals(existing.status()) && !"MANUAL_QUEUE".equals(existing.status())) {
            throw new OnboardingConflictException("Onboarding em status inválido para verify: " + existing.status());
        }
        // Lab stub Serpro: CNPJ ending with 9 → MANUAL_QUEUE; else VERIFIED
        boolean manual = command.forceManualQueue() || existing.cnpj().endsWith("9");
        String status = manual ? "MANUAL_QUEUE" : "VERIFIED";
        String verification = manual ? "MANUAL_QUEUE" : "SERPRO_OK";
        onboardingRepo.save(new OnboardingRepositoryPort.OnboardingRecord(
                existing.id(), existing.cnpj(), existing.legalName(), existing.representative(),
                status, existing.tenantId(), existing.createdAt(), existing.completedAt()
        ));
        return new Result(existing.id(), status, verification);
    }
}
