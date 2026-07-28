package br.com.ebv.prisma.infrastructure.adapter.persistence.scoring;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ScoreHistoryJpaRepository extends JpaRepository<ScoreHistoryEntity, Long> {

    Page<ScoreHistoryEntity> findByDocumentoOrderByAtDesc(String documento, Pageable pageable);

    long countByDocumento(String documento);
}
