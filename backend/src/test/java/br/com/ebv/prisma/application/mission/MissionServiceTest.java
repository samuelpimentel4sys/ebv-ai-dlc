package br.com.ebv.prisma.application.mission;

import br.com.ebv.prisma.domain.mission.port.in.ProgressMissionUseCase;
import br.com.ebv.prisma.domain.mission.port.out.MissionRepositoryPort;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MissionServiceTest {

    @Mock MissionRepositoryPort repo;

    @Test
    @DisplayName("F05 progress completa missão e gera achievement")
    void progressCompletes() {
        UUID mid = UUID.fromString("e0000000-0000-4000-8000-000000000001");
        when(repo.findCatalog(mid)).thenReturn(Optional.of(
                new MissionRepositoryPort.CatalogRecord(mid, "PAY_ON_TIME_3M", "Pague em dia 3 meses", "{}", true)));
        when(repo.findEnrollment(any(), any())).thenReturn(Optional.of(
                new MissionRepositoryPort.EnrollmentRecord(UUID.randomUUID(), mid, "hash", "ACTIVE", new BigDecimal("80.00"))));
        var svc = new ProgressMissionService(repo);
        var r = svc.execute(new ProgressMissionUseCase.Command(
                mid, "12345678901", "UTILITY_PAYMENT_ON_TIME", UUID.randomUUID(), new BigDecimal("25.00")));
        assertThat(r.status()).isEqualTo("COMPLETED");
        assertThat(r.achievementEarned()).isTrue();
        verify(repo).saveAchievement(any());
    }
}
