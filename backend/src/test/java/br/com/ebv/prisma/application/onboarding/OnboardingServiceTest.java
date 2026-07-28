package br.com.ebv.prisma.application.onboarding;

import br.com.ebv.prisma.domain.credential.port.in.CreateCredentialUseCase;
import br.com.ebv.prisma.domain.onboarding.port.in.CompleteOnboardingUseCase;
import br.com.ebv.prisma.domain.onboarding.port.in.StartOnboardingUseCase;
import br.com.ebv.prisma.domain.onboarding.port.in.VerifyOnboardingUseCase;
import br.com.ebv.prisma.domain.onboarding.port.out.OnboardingRepositoryPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OnboardingServiceTest {

    @Mock OnboardingRepositoryPort onboardingRepo;
    @Mock CreateCredentialUseCase createCredential;

    StartOnboardingService start;
    VerifyOnboardingService verify;
    CompleteOnboardingService complete;

    @BeforeEach
    void setUp() {
        start = new StartOnboardingService(onboardingRepo);
        verify = new VerifyOnboardingService(onboardingRepo);
        complete = new CompleteOnboardingService(onboardingRepo, createCredential);
    }

    @Test
    @DisplayName("F03 start → verify Serpro OK → complete emite SANDBOX")
    void happyPath() {
        when(onboardingRepo.existsCompletedByCnpj("12345678000190")).thenReturn(false);

        var started = start.execute(new StartOnboardingUseCase.Command(
                "12345678000190", "Empresa Lab LTDA", "Maria Silva"
        ));
        assertThat(started.status()).isEqualTo("STARTED");

        ArgumentCaptor<OnboardingRepositoryPort.OnboardingRecord> saveCap =
                ArgumentCaptor.forClass(OnboardingRepositoryPort.OnboardingRecord.class);
        verify(onboardingRepo).save(saveCap.capture());
        UUID id = saveCap.getValue().id();

        when(onboardingRepo.findById(id)).thenReturn(Optional.of(saveCap.getValue()));
        var verified = verify.execute(new VerifyOnboardingUseCase.Command(id, false));
        assertThat(verified.status()).isEqualTo("VERIFIED");
        assertThat(verified.verification()).isEqualTo("SERPRO_OK");

        OnboardingRepositoryPort.OnboardingRecord verifiedRec = new OnboardingRepositoryPort.OnboardingRecord(
                id, "12345678000190", "Empresa Lab LTDA", "Maria Silva",
                "VERIFIED", null, Instant.now().minusSeconds(60), null
        );
        when(onboardingRepo.findById(id)).thenReturn(Optional.of(verifiedRec));
        when(createCredential.execute(any())).thenReturn(new CreateCredentialUseCase.Result(
                UUID.randomUUID(), "ebv_live_test_abcd", "ebv_test_secret",
                List.of("credit.score.read"), "SANDBOX", "ACTIVE"
        ));

        var done = complete.execute(new CompleteOnboardingUseCase.Command(
                id, CompleteOnboardingService.CONTRACT_VERSION, true, "fin@lab.com"
        ));
        assertThat(done.status()).isEqualTo("COMPLETED");
        assertThat(done.credential().env()).isEqualTo("SANDBOX");
        assertThat(done.credential().secret()).isNotBlank();
    }
}
