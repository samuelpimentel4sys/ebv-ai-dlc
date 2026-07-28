package br.com.ebv.prisma.application.identity;

import br.com.ebv.prisma.domain.identity.exception.CyclicMergeException;
import br.com.ebv.prisma.domain.identity.model.DocumentoCanonico;
import br.com.ebv.prisma.domain.identity.model.GoldenRecord;
import br.com.ebv.prisma.domain.identity.model.GoldenRecordId;
import br.com.ebv.prisma.domain.identity.model.GoldenRecordStatus;
import br.com.ebv.prisma.domain.identity.port.in.EvaluatePairingUseCase;
import br.com.ebv.prisma.domain.identity.port.in.MergeIdentityUseCase;
import br.com.ebv.prisma.domain.identity.port.in.UndoMergeUseCase;
import br.com.ebv.prisma.domain.identity.port.out.GoldenRecordRepositoryPort;
import br.com.ebv.prisma.domain.identity.port.out.IdentityCorrectionPublisherPort;
import br.com.ebv.prisma.domain.identity.service.SimilarityBandService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class IdentityUseCasesTest {

    @Mock
    GoldenRecordRepositoryPort repository;

    @Test
    @DisplayName("CT-03 merge humano bumpa versão e marca MERGED")
    void humanMerge() {
        MergeIdentityService mergeIdentityService = new MergeIdentityService(repository);
        GoldenRecord survivor = GoldenRecord.create(new DocumentoCanonico("12345678901"));
        GoldenRecord merged = GoldenRecord.create(new DocumentoCanonico("12345678901"));

        when(repository.findById(any())).thenAnswer(inv -> {
            GoldenRecordId id = inv.getArgument(0);
            if (id.equals(survivor.getId())) {
                return Optional.of(survivor);
            }
            if (id.equals(merged.getId())) {
                return Optional.of(merged);
            }
            return Optional.empty();
        });
        when(repository.wouldCreateCycle(survivor.getId(), merged.getId())).thenReturn(false);
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        GoldenRecord result = mergeIdentityService.execute(new MergeIdentityUseCase.MergeCommand(
                survivor.getId(), merged.getId(), new BigDecimal("0.88"), "SAME_CPF", UUID.randomUUID()
        ));

        assertThat(merged.getStatus()).isEqualTo(GoldenRecordStatus.MERGED);
        assertThat(survivor.getVersion()).isEqualTo(2);
        assertThat(result.getId()).isEqualTo(survivor.getId());
        verify(repository).appendMergeTrail(eq("MERGE"), eq(merged.getId()), eq(survivor.getId()), any());
        verify(repository).resolveCandidate(survivor.getId(), merged.getId());
    }

    @Test
    @DisplayName("CT-05 merge cíclico → CyclicMergeException")
    void cyclicMerge() {
        MergeIdentityService mergeIdentityService = new MergeIdentityService(repository);
        GoldenRecordId a = GoldenRecordId.generate();
        GoldenRecordId b = GoldenRecordId.generate();
        GoldenRecord ga = new GoldenRecord(a, new DocumentoCanonico("12345678901"), 1, GoldenRecordStatus.ACTIVE);
        GoldenRecord gb = new GoldenRecord(b, new DocumentoCanonico("12345678901"), 1, GoldenRecordStatus.ACTIVE);
        when(repository.findById(a)).thenReturn(Optional.of(ga));
        when(repository.findById(b)).thenReturn(Optional.of(gb));
        when(repository.wouldCreateCycle(a, b)).thenReturn(true);

        assertThatThrownBy(() -> mergeIdentityService.execute(new MergeIdentityUseCase.MergeCommand(
                a, b, new BigDecimal("0.99"), "CYCLE", UUID.randomUUID()
        ))).isInstanceOf(CyclicMergeException.class);

        verify(repository, never()).save(any());
    }

    @Test
    @DisplayName("CT-01 auto-merge via EvaluatePairing")
    void autoMergePairing() {
        MergeIdentityService merge = new MergeIdentityService(repository);
        EvaluatePairingService evaluate = new EvaluatePairingService(
                repository, merge, SimilarityBandService.defaults());

        GoldenRecord left = GoldenRecord.create(new DocumentoCanonico("12345678901"));
        GoldenRecord right = GoldenRecord.create(new DocumentoCanonico("12345678901"));
        when(repository.findById(any())).thenAnswer(inv -> {
            GoldenRecordId id = inv.getArgument(0);
            if (id.equals(left.getId())) {
                return Optional.of(left);
            }
            if (id.equals(right.getId())) {
                return Optional.of(right);
            }
            return Optional.empty();
        });
        when(repository.wouldCreateCycle(any(), any())).thenReturn(false);
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        var result = evaluate.execute(new EvaluatePairingUseCase.PairingCommand(
                left.getId(), right.getId(), new BigDecimal("0.97"), UUID.randomUUID()
        ));

        assertThat(result.band()).isEqualTo(SimilarityBandService.Band.AUTO_MERGE);
        assertThat(result.mergedSurvivor()).isPresent();
        verify(repository, never()).enqueueCandidate(any(), any(), any());
    }

    @Test
    @DisplayName("CT-02 faixa média enfileira candidato")
    void humanReviewEnqueue() {
        MergeIdentityService merge = new MergeIdentityService(repository);
        EvaluatePairingService evaluate = new EvaluatePairingService(
                repository, merge, SimilarityBandService.defaults());
        GoldenRecordId left = GoldenRecordId.generate();
        GoldenRecordId right = GoldenRecordId.generate();
        when(repository.findById(left)).thenReturn(Optional.of(
                new GoldenRecord(left, new DocumentoCanonico("12345678901"), 1, GoldenRecordStatus.ACTIVE)));
        when(repository.findById(right)).thenReturn(Optional.of(
                new GoldenRecord(right, new DocumentoCanonico("98765432100"), 1, GoldenRecordStatus.ACTIVE)));
        UUID candidateId = UUID.randomUUID();
        when(repository.enqueueCandidate(eq(left), eq(right), any())).thenReturn(candidateId);

        var result = evaluate.execute(new EvaluatePairingUseCase.PairingCommand(
                left, right, new BigDecimal("0.80"), UUID.randomUUID()
        ));

        assertThat(result.band()).isEqualTo(SimilarityBandService.Band.HUMAN_REVIEW);
        assertThat(result.candidateId()).contains(candidateId);
        verify(repository, never()).save(any());
    }

    @Test
    @DisplayName("CT-04 undo merge restaura MERGED e publica correção")
    void undoMerge() {
        IdentityCorrectionPublisherPort publisher = event ->
                new IdentityCorrectionPublisherPort.PublishAck("prisma.identity.corrections", 0, 7L);
        UndoMergeService undo = new UndoMergeService(repository, publisher);

        GoldenRecord survivor = GoldenRecord.create(new DocumentoCanonico("12345678901"));
        survivor.bumpVersionAfterMerge(); // pós-merge
        GoldenRecord merged = GoldenRecord.create(new DocumentoCanonico("12345678901"));
        merged.markMerged();

        when(repository.findById(any())).thenAnswer(inv -> {
            GoldenRecordId id = inv.getArgument(0);
            if (id.equals(survivor.getId())) {
                return Optional.of(survivor);
            }
            if (id.equals(merged.getId())) {
                return Optional.of(merged);
            }
            return Optional.empty();
        });
        when(repository.hasOpenMerge(merged.getId(), survivor.getId())).thenReturn(true);
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UndoMergeUseCase.UndoResult result = undo.execute(new UndoMergeUseCase.UndoCommand(
                survivor.getId(), merged.getId(), UUID.randomUUID()
        ));

        assertThat(merged.getStatus()).isEqualTo(GoldenRecordStatus.ACTIVE);
        assertThat(survivor.getVersion()).isEqualTo(3);
        assertThat(result.kafkaTopic()).isEqualTo("prisma.identity.corrections");
        assertThat(result.kafkaOffset()).isEqualTo(7L);
        verify(repository).appendMergeTrail(eq("UNDO"), eq(merged.getId()), eq(survivor.getId()), any());
    }

    @Test
    @DisplayName("CT-04b undo sem MERGE aberto → MergeUndoNotAllowedException")
    void undoWithoutOpenMerge() {
        IdentityCorrectionPublisherPort publisher = event ->
                new IdentityCorrectionPublisherPort.PublishAck("local", 0, 0L);
        UndoMergeService undo = new UndoMergeService(repository, publisher);
        GoldenRecord survivor = GoldenRecord.create(new DocumentoCanonico("12345678901"));
        GoldenRecord merged = GoldenRecord.create(new DocumentoCanonico("12345678901"));
        merged.markMerged();
        when(repository.findById(survivor.getId())).thenReturn(Optional.of(survivor));
        when(repository.findById(merged.getId())).thenReturn(Optional.of(merged));
        when(repository.hasOpenMerge(merged.getId(), survivor.getId())).thenReturn(false);

        assertThatThrownBy(() -> undo.execute(new UndoMergeUseCase.UndoCommand(
                survivor.getId(), merged.getId(), UUID.randomUUID()
        ))).isInstanceOf(br.com.ebv.prisma.domain.identity.exception.MergeUndoNotAllowedException.class);
    }

    @Test
    @DisplayName("CT-06 GET identity por documento")
    void getIdentity() {
        GetIdentityService getIdentity = new GetIdentityService(repository);
        GoldenRecord gr = GoldenRecord.create(new DocumentoCanonico("12345678901"));
        when(repository.findActiveByDocumento(any())).thenReturn(Optional.of(gr));

        GoldenRecord found = getIdentity.execute("123.456.789-01");
        assertThat(found.getCanonicalDocumento().value()).isEqualTo("12345678901");
    }
}
