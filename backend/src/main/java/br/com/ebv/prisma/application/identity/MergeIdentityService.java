package br.com.ebv.prisma.application.identity;

import br.com.ebv.prisma.domain.identity.exception.CyclicMergeException;
import br.com.ebv.prisma.domain.identity.exception.GoldenRecordNotFoundException;
import br.com.ebv.prisma.domain.identity.model.GoldenRecord;
import br.com.ebv.prisma.domain.identity.port.in.MergeIdentityUseCase;
import br.com.ebv.prisma.domain.identity.port.out.GoldenRecordRepositoryPort;
import br.com.ebv.prisma.domain.identity.port.out.IdentityCorrectionPublisherPort;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class MergeIdentityService implements MergeIdentityUseCase {

    private final GoldenRecordRepositoryPort repository;
    private final IdentityCorrectionPublisherPort correctionPublisher;

    @Autowired
    public MergeIdentityService(
            GoldenRecordRepositoryPort repository,
            IdentityCorrectionPublisherPort correctionPublisher
    ) {
        this.repository = repository;
        this.correctionPublisher = correctionPublisher;
    }

    /** Compatível com testes unitários sem Kafka. */
    public MergeIdentityService(GoldenRecordRepositoryPort repository) {
        this(repository, event -> new IdentityCorrectionPublisherPort.PublishAck("local", 0, 0L));
    }

    @Override
    @Transactional
    public GoldenRecord execute(MergeCommand command) {
        if (command.survivorGrId().equals(command.mergedGrId())) {
            throw new IllegalArgumentException("survivor e merged devem ser distintos");
        }

        GoldenRecord survivor = repository.findById(command.survivorGrId())
                .orElseThrow(() -> new GoldenRecordNotFoundException(command.survivorGrId()));
        GoldenRecord merged = repository.findById(command.mergedGrId())
                .orElseThrow(() -> new GoldenRecordNotFoundException(command.mergedGrId()));

        if (repository.wouldCreateCycle(command.survivorGrId(), command.mergedGrId())) {
            throw new CyclicMergeException(command.survivorGrId(), command.mergedGrId());
        }

        merged.markMerged();
        repository.save(merged);

        repository.reassignLinks(command.mergedGrId(), command.survivorGrId());
        survivor.bumpVersionAfterMerge();
        GoldenRecord saved = repository.save(survivor);

        repository.appendMergeTrail(
                "MERGE",
                command.mergedGrId(),
                command.survivorGrId(),
                command.actorId()
        );
        repository.resolveCandidate(command.survivorGrId(), command.mergedGrId());

        correctionPublisher.publish(new IdentityCorrectionPublisherPort.CorrectionEvent(
                UUID.randomUUID(),
                "MERGE",
                command.mergedGrId(),
                command.survivorGrId(),
                saved.getCanonicalDocumento().value(),
                saved.getVersion(),
                command.actorId()
        ));

        return repository.findById(saved.getId()).orElse(saved);
    }
}
