package br.com.ebv.prisma.infrastructure.adapter.persistence.utilitylink;

import br.com.ebv.prisma.domain.utilitylink.port.out.UtilityLinkRepositoryPort;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
@Transactional
public class UtilityLinkRepositoryAdapter implements UtilityLinkRepositoryPort {

    private final UtilityLinkJpaRepository jpa;

    public UtilityLinkRepositoryAdapter(UtilityLinkJpaRepository jpa) { this.jpa = jpa; }

    @Override
    public void save(LinkRecord record) {
        UtilityLinkEntity e = new UtilityLinkEntity();
        e.setLinkId(record.linkId());
        e.setDocumentoHash(record.documentoHash());
        e.setPartnerCode(record.partnerCode());
        e.setAccountRef(record.accountRef());
        e.setUtilityType(record.utilityType());
        e.setStatus(record.status());
        e.setLinkedAt(OffsetDateTime.ofInstant(record.linkedAt(), ZoneOffset.UTC));
        e.setUnlinkedAt(record.unlinkedAt() == null ? null : OffsetDateTime.ofInstant(record.unlinkedAt(), ZoneOffset.UTC));
        jpa.save(e);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<LinkRecord> findById(UUID linkId) {
        return jpa.findById(linkId).map(this::toRecord);
    }

    @Override
    @Transactional(readOnly = true)
    public List<LinkRecord> findByDocumentoHash(String documentoHash) {
        return jpa.findByDocumentoHashOrderByLinkedAtDesc(documentoHash).stream().map(this::toRecord).toList();
    }

    private LinkRecord toRecord(UtilityLinkEntity e) {
        return new LinkRecord(
                e.getLinkId(), e.getDocumentoHash(), e.getPartnerCode(), e.getAccountRef(),
                e.getUtilityType(), e.getStatus(), e.getLinkedAt().toInstant(),
                e.getUnlinkedAt() == null ? null : e.getUnlinkedAt().toInstant()
        );
    }
}
