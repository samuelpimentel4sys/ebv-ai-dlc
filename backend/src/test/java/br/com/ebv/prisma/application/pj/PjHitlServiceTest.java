package br.com.ebv.prisma.application.pj;

import br.com.ebv.prisma.domain.pj.exception.PjConflictException;
import br.com.ebv.prisma.domain.pj.exception.PjForbiddenException;
import br.com.ebv.prisma.domain.pj.port.in.DecidePjOpinionUseCase;
import br.com.ebv.prisma.domain.pj.port.in.SubmitPjOpinionUseCase;
import br.com.ebv.prisma.domain.pj.port.out.PjHitlRepositoryPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PjHitlServiceTest {

    @Mock PjHitlRepositoryPort repo;

    SubmitPjOpinionService submit;
    DecidePjOpinionService decide;

    static final UUID OPINION = UUID.fromString("34b6c016-7acc-4f94-891b-4320ad8b5e48");
    static final UUID CREATOR = UUID.fromString("11111111-1111-4111-8111-111111111111");
    static final UUID APPROVER = UUID.fromString("22222222-2222-4222-8222-222222222222");

    @BeforeEach
    void setUp() {
        submit = new SubmitPjOpinionService(repo);
        decide = new DecidePjOpinionService(repo);
    }

    @Test
    @DisplayName("CA-01 submit READY_FOR_REVIEW → L2 por valor")
    void submitRoutesL2() {
        when(repo.findOpinion(OPINION)).thenReturn(Optional.of(opinion("READY_FOR_REVIEW", new BigDecimal("750000"))));
        when(repo.latestGuardrailStatus(OPINION)).thenReturn(Optional.of("PASSED"));
        when(repo.findPolicyForAmount(new BigDecimal("750000"))).thenReturn(Optional.of(
                new PjHitlRepositoryPort.PolicyRecord(UUID.randomUUID(), new BigDecimal("500000.01"),
                        new BigDecimal("5000000"), "L2", "ROLE_APROVADOR_PJ_L2")));

        var r = submit.execute(new SubmitPjOpinionUseCase.Command(OPINION, CREATOR, "encaminho"));
        assertThat(r.status()).isEqualTo("SUBMITTED");
        assertThat(r.requiredLevel()).isEqualTo("L2");
        verify(repo).updateOpinionStatus(OPINION, "SUBMITTED");
        verify(repo).appendTrail(any());
    }

    @Test
    @DisplayName("submit DRAFT → 409")
    void submitDraftConflict() {
        when(repo.findOpinion(OPINION)).thenReturn(Optional.of(opinion("DRAFT", BigDecimal.TEN)));
        assertThatThrownBy(() -> submit.execute(new SubmitPjOpinionUseCase.Command(OPINION, CREATOR, null)))
                .isInstanceOf(PjConflictException.class);
    }

    @Test
    @DisplayName("CA-02 approve L2 ok")
    void approveL2() {
        when(repo.findOpinion(OPINION)).thenReturn(Optional.of(opinion("SUBMITTED", new BigDecimal("750000"))));
        when(repo.listTrail(OPINION)).thenReturn(List.of(
                new PjHitlRepositoryPort.TrailRecord(UUID.randomUUID(), OPINION, "SUBMIT", CREATOR, "L2", null, Instant.now())
        ));

        var r = decide.execute(new DecidePjOpinionUseCase.Command(OPINION, APPROVER, "APPROVE", "ok", "L2"));
        assertThat(r.status()).isEqualTo("APPROVED");
        verify(repo).updateOpinionStatus(OPINION, "APPROVED");
    }

    @Test
    @DisplayName("CA-03 L1 insuficiente → escalate")
    void approveL1Escalates() {
        when(repo.findOpinion(OPINION)).thenReturn(Optional.of(opinion("SUBMITTED", new BigDecimal("750000"))));
        when(repo.listTrail(OPINION)).thenReturn(List.of(
                new PjHitlRepositoryPort.TrailRecord(UUID.randomUUID(), OPINION, "SUBMIT", CREATOR, "L2", null, Instant.now())
        ));

        var r = decide.execute(new DecidePjOpinionUseCase.Command(OPINION, APPROVER, "APPROVE", "tento L1", "L1"));
        assertThat(r.status()).isEqualTo("SUBMITTED");
        assertThat(r.levelCode()).isEqualTo("L3");

        ArgumentCaptor<PjHitlRepositoryPort.TrailRecord> cap = ArgumentCaptor.forClass(PjHitlRepositoryPort.TrailRecord.class);
        verify(repo).appendTrail(cap.capture());
        assertThat(cap.getValue().action()).isEqualTo("ESCALATE");
    }

    @Test
    @DisplayName("CA-04 criador approve → 403")
    void creatorCannotApprove() {
        when(repo.findOpinion(OPINION)).thenReturn(Optional.of(opinion("SUBMITTED", BigDecimal.TEN)));
        assertThatThrownBy(() -> decide.execute(
                new DecidePjOpinionUseCase.Command(OPINION, CREATOR, "APPROVE", "x", "L3")))
                .isInstanceOf(PjForbiddenException.class);
    }

    private static PjHitlRepositoryPort.OpinionRecord opinion(String status, BigDecimal amount) {
        return new PjHitlRepositoryPort.OpinionRecord(OPINION, "12345678000199", status, CREATOR, amount, "BRL");
    }
}
