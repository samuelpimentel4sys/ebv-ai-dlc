package br.com.ebv.prisma.application.onboarding;

import br.com.ebv.prisma.domain.onboarding.exception.OnboardingConflictException;
import br.com.ebv.prisma.domain.onboarding.exception.OnboardingValidationException;
import br.com.ebv.prisma.domain.onboarding.port.in.StartOnboardingUseCase;
import br.com.ebv.prisma.domain.onboarding.port.out.OnboardingRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class StartOnboardingService implements StartOnboardingUseCase {

    private final OnboardingRepositoryPort onboardingRepo;

    public StartOnboardingService(OnboardingRepositoryPort onboardingRepo) {
        this.onboardingRepo = onboardingRepo;
    }

    @Override
    @Transactional
    public Result execute(Command command) {
        if (command.cnpj() == null || !command.cnpj().matches("\\d{14}")) {
            throw new OnboardingValidationException("cnpj deve ter 14 dígitos");
        }
        if (command.legalName() == null || command.legalName().isBlank()) {
            throw new OnboardingValidationException("legalName obrigatório");
        }
        if (command.representative() == null || command.representative().isBlank()) {
            throw new OnboardingValidationException("representative obrigatório");
        }
        if (onboardingRepo.existsCompletedByCnpj(command.cnpj())) {
            throw new OnboardingConflictException("CNPJ já possui tenant ativo");
        }
        UUID id = UUID.randomUUID();
        Instant now = Instant.now();
        onboardingRepo.save(new OnboardingRepositoryPort.OnboardingRecord(
                id, command.cnpj(), command.legalName().trim(), command.representative().trim(),
                "STARTED", null, now, null
        ));
        return new Result(id, "STARTED");
    }
}
