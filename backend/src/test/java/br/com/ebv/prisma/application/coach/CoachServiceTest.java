package br.com.ebv.prisma.application.coach;

import br.com.ebv.prisma.domain.coach.exception.CoachValidationException;
import br.com.ebv.prisma.domain.coach.port.in.GetCoachJourneyUseCase;
import br.com.ebv.prisma.domain.coach.port.in.UpsertCoachGoalsUseCase;
import br.com.ebv.prisma.domain.coach.port.out.CoachRepositoryPort;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CoachServiceTest {

    @Mock CoachRepositoryPort repo;

    @Test
    @DisplayName("F03 cria jornada lab com meta sugerida")
    void journeyCreates() {
        when(repo.findActiveJourney(anyString())).thenReturn(Optional.empty());
        when(repo.findGoals(any())).thenReturn(List.of());
        var svc = new GetCoachJourneyService(repo);
        var r = svc.execute(new GetCoachJourneyUseCase.Query("12345678901"));
        assertThat(r.status()).isEqualTo("ACTIVE");
        assertThat(r.journeyId()).isNotNull();
    }

    @Test
    @DisplayName("F03 bloqueia garantia de aprovação")
    void blocksGuarantee() {
        var svc = new UpsertCoachGoalsService(repo);
        assertThatThrownBy(() -> svc.execute(new UpsertCoachGoalsUseCase.Command(
                "12345678901",
                List.of(new UpsertCoachGoalsUseCase.GoalInput("PAY", "Meta", "aprovação garantida", false))
        ))).isInstanceOf(CoachValidationException.class);
    }
}
