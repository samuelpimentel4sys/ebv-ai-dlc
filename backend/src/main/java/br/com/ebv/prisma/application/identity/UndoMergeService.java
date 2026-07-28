package br.com.ebv.prisma.application.identity;

import br.com.ebv.prisma.domain.identity.exception.GoldenRecordNotFoundException;
import br.com.ebv.prisma.domain.identity.exception.MergeUndoNotAllowedException;
import br.com.ebv.prisma.domain.identity.model.GoldenRecord;
import br.com.ebv.prisma.domain.identity.model.GoldenRecordStatus;
import br.com.ebv.prisma.domain.identity.port.in.UndoMergeUseCase;
import br.com.ebv.prisma.domain.identity.port.out.GoldenRecordRepositoryPort;
import br.com.ebv.prisma.domain.identity.port.out.IdentityCorrectionPublisherPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class UndoMergeService implements UndoMergeUseCase {

    private final GoldenRecordRepositoryPort repository;
    private final IdentityCorrectionPublisherPort correctionPublisher;

    public UndoMergeService(
            GoldenRecordRepositoryPort repository,
            IdentityCorrectionPublisherPort correctionPublisher
    ) {
        this.repository = repository;
        this.correctionPublisher = correctionPublisher;
    }

    @Override
    @Transactional
    public UndoResult execute(UndoCommand command) {
        if (command.survivorGrId().equals(command.mergedGrId())) {
            throw new IllegalArgumentException("survivor e merged devem ser distintos");
        }

        GoldenRecord survivor = repository.findById(command.survivorGrId())
                .orElseThrow(() -> new GoldenRecordNotFoundException(command.survivorGrId()));
        GoldenRecord merged = repository.findById(command.mergedGrId())
                .orElseThrow(() -> new GoldenRecordNotFoundException(command.mergedGrId()));

        if (merged.getStatus() != GoldenRecordStatus.MERGED) {
            throw new MergeUndoNotAllowedException(
                    command.survivorGrId(), command.mergedGrId(), "merged não está MERGED");
        }

        if (!repository.hasOpenMerge(command.mergedGrId(), command.survivorGrId())) {
            throw new MergeUndoNotAllowedException(
                    command.survivorGrId(), command.mergedGrId(), "sem MERGE aberto na trilha");
        }

        merged.restoreActive();
        repository.save(merged);

        survivor.bumpVersionAfterMerge();
        GoldenRecord savedSurvivor = repository.save(survivor);

        repository.appendMergeTrail(
                "UNDO",
                command.mergedGrId(),
                command.survivorGrId(),
                command.actorId()
        );

        var ack = correctionPublisher.publish(new IdentityCorrectionPublisherPort.CorrectionEvent(
                UUID.randomUUID(),
                "UNDO_MERGE",
                command.mergedGrId(),
                command.survivorGrId(),
                savedSurvivor.getCanonicalDocumento().value(),
                savedSurvivor.getVersion(),
                command.actorId()
        ));

        return new UndoResult(
                repository.findById(merged.getId()).orElse(merged),
                repository.findById(savedSurvivor.getId()).orElse(savedSurvivor),
                ack.topic(),
                ack.offset()
        );
    }
}
