package br.com.ebv.prisma.infrastructure.adapter.persistence.utilitylink;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface UtilityLinkJpaRepository extends JpaRepository<UtilityLinkEntity, UUID> {
    List<UtilityLinkEntity> findByDocumentoHashOrderByLinkedAtDesc(String documentoHash);
}
