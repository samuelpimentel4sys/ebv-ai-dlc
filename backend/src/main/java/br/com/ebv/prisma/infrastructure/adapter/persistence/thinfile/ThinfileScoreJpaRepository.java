package br.com.ebv.prisma.infrastructure.adapter.persistence.thinfile;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ThinfileScoreJpaRepository extends JpaRepository<ThinfileScoreEntity, UUID> {
    Optional<ThinfileScoreEntity> findFirstByDocumentoHashOrderByCalculatedAtDesc(String documentoHash);
}
