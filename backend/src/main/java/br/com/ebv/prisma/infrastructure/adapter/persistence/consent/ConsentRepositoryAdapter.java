package br.com.ebv.prisma.infrastructure.adapter.persistence.consent;

import br.com.ebv.prisma.domain.consent.port.out.ConsentRepositoryPort;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
@Transactional
public class ConsentRepositoryAdapter implements ConsentRepositoryPort {

    private final ConsentJpaRepository jpa;

    public ConsentRepositoryAdapter(ConsentJpaRepository jpa) {
        this.jpa = jpa;
    }

    @Override
    public void save(ConsentRecord record) {
        ConsentEntity e = new ConsentEntity();
        e.setConsentId(record.consentId());
        e.setDocumentoHash(record.documentoHash());
        e.setPurposeCode(record.purposeCode());
        e.setSourceCode(record.sourceCode());
        e.setStatus(record.status());
        e.setGrantedAt(OffsetDateTime.ofInstant(record.grantedAt(), ZoneOffset.UTC));
        e.setRevokedAt(record.revokedAt() == null ? null : OffsetDateTime.ofInstant(record.revokedAt(), ZoneOffset.UTC));
        e.setValidTo(record.validTo() == null ? null : OffsetDateTime.ofInstant(record.validTo(), ZoneOffset.UTC));
        e.setChannel(record.channel());
        e.setVersionTermo(record.versionTermo());
        jpa.save(e);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<ConsentRecord> findById(UUID consentId) {
        return jpa.findById(consentId).map(this::toRecord);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ConsentRecord> findByDocumentoHash(String documentoHash) {
        return jpa.findByDocumentoHashOrderByGrantedAtDesc(documentoHash).stream().map(this::toRecord).toList();
    }

    private ConsentRecord toRecord(ConsentEntity e) {
        return new ConsentRecord(
                e.getConsentId(), e.getDocumentoHash(), e.getPurposeCode(), e.getSourceCode(), e.getStatus(),
                e.getGrantedAt().toInstant(),
                e.getRevokedAt() == null ? null : e.getRevokedAt().toInstant(),
                e.getValidTo() == null ? null : e.getValidTo().toInstant(),
                e.getChannel(), e.getVersionTermo()
        );
    }
}
