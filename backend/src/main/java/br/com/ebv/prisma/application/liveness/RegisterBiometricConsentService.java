package br.com.ebv.prisma.application.liveness;

import br.com.ebv.prisma.domain.liveness.exception.LivenessValidationException;
import br.com.ebv.prisma.domain.liveness.port.in.RegisterBiometricConsentUseCase;
import br.com.ebv.prisma.domain.liveness.port.out.LivenessRepositoryPort;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RegisterBiometricConsentService implements RegisterBiometricConsentUseCase {

    private final LivenessRepositoryPort repo;
    private final String defaultTerm;

    public RegisterBiometricConsentService(
            LivenessRepositoryPort repo,
            @Value("${prisma.liveness.term-version:v1.0}") String defaultTerm
    ) {
        this.repo = repo;
        this.defaultTerm = defaultTerm;
    }

    @Override
    @Transactional
    public Result execute(Command command) {
        if (command.customerId() == null) {
            throw new LivenessValidationException("customer_id obrigatório");
        }
        String term = command.termVersion() == null || command.termVersion().isBlank()
                ? defaultTerm
                : command.termVersion();
        repo.upsertActiveConsent(command.customerId(), term, command.ipAddress(), command.userAgent());
        return new Result(command.customerId(), term, "ACTIVE");
    }
}
