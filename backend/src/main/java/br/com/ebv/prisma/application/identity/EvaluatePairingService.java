package br.com.ebv.prisma.application.identity;

import br.com.ebv.prisma.domain.identity.exception.GoldenRecordNotFoundException;
import br.com.ebv.prisma.domain.identity.model.GoldenRecord;
import br.com.ebv.prisma.domain.identity.port.in.EvaluatePairingUseCase;
import br.com.ebv.prisma.domain.identity.port.in.MergeIdentityUseCase;
import br.com.ebv.prisma.domain.identity.port.out.GoldenRecordRepositoryPort;
import br.com.ebv.prisma.domain.identity.service.SimilarityBandService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

@Service
public class EvaluatePairingService implements EvaluatePairingUseCase {

    private final GoldenRecordRepositoryPort repository;
    private final MergeIdentityUseCase mergeIdentityUseCase;
    private final SimilarityBandService bandService;

    @Autowired
    public EvaluatePairingService(
            GoldenRecordRepositoryPort repository,
            MergeIdentityUseCase mergeIdentityUseCase,
            @Value("${prisma.identity.auto-merge-threshold:0.95}") String autoMerge,
            @Value("${prisma.identity.human-review-threshold:0.70}") String humanReview
    ) {
        this(repository, mergeIdentityUseCase,
                new SimilarityBandService(new BigDecimal(autoMerge), new BigDecimal(humanReview)));
    }

    /** Para testes unitários. */
    public EvaluatePairingService(
            GoldenRecordRepositoryPort repository,
            MergeIdentityUseCase mergeIdentityUseCase,
            SimilarityBandService bandService
    ) {
        this.repository = repository;
        this.mergeIdentityUseCase = mergeIdentityUseCase;
        this.bandService = bandService;
    }

    @Override
    @Transactional
    public PairingResult execute(PairingCommand command) {
        repository.findById(command.leftGrId())
                .orElseThrow(() -> new GoldenRecordNotFoundException(command.leftGrId()));
        repository.findById(command.rightGrId())
                .orElseThrow(() -> new GoldenRecordNotFoundException(command.rightGrId()));

        SimilarityBandService.Band band = bandService.classify(command.confidence());
        return switch (band) {
            case AUTO_MERGE -> {
                GoldenRecord survivor = mergeIdentityUseCase.execute(new MergeIdentityUseCase.MergeCommand(
                        command.leftGrId(),
                        command.rightGrId(),
                        command.confidence(),
                        "AUTO_MERGE",
                        command.actorId() != null ? command.actorId() : UUID.fromString("00000000-0000-4000-8000-000000000001")
                ));
                yield new PairingResult(band, Optional.of(survivor), Optional.empty());
            }
            case HUMAN_REVIEW -> {
                UUID candidateId = repository.enqueueCandidate(
                        command.leftGrId(), command.rightGrId(), command.confidence());
                yield new PairingResult(band, Optional.empty(), Optional.of(candidateId));
            }
            case DISCARD -> new PairingResult(band, Optional.empty(), Optional.empty());
        };
    }
}
