package br.com.ebv.prisma.infrastructure.adapter.persistence.dossier;

import br.com.ebv.prisma.domain.dossier.port.out.DossierRepositoryPort;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;

@Component
@Transactional
public class DossierRepositoryAdapter implements DossierRepositoryPort {

    private final DossierJpaRepository jpa;

    public DossierRepositoryAdapter(DossierJpaRepository jpa) {
        this.jpa = jpa;
    }

    @Override
    public void save(DossierRecord record) {
        DossierEntity e = new DossierEntity();
        e.setId(record.id());
        e.setDecisionId(record.decisionId());
        e.setPurpose(record.purpose());
        e.setLegalBasis(record.legalBasis());
        e.setStatus(record.status());
        e.setFormats(record.formatsJson());
        e.setArtifactJson(record.artifactJson());
        e.setArtifactPdfUri(record.artifactPdfUri());
        e.setManifestHash(record.manifestHash());
        e.setCreatedAt(OffsetDateTime.ofInstant(record.createdAt(), ZoneOffset.UTC));
        jpa.save(e);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<DossierRecord> findById(UUID id) {
        return jpa.findById(id).map(e -> new DossierRecord(
                e.getId(), e.getDecisionId(), e.getPurpose(), e.getLegalBasis(),
                e.getStatus(), e.getFormats(), e.getArtifactJson(), e.getArtifactPdfUri(),
                e.getManifestHash(), e.getCreatedAt().toInstant()
        ));
    }
}
