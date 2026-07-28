package br.com.ebv.prisma.infrastructure.adapter.persistence.consent;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ConsentJpaRepository extends JpaRepository<ConsentEntity, UUID> {
    List<ConsentEntity> findByDocumentoHashOrderByGrantedAtDesc(String documentoHash);
}
