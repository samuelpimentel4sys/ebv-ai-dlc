package br.com.ebv.prisma.infrastructure.adapter.persistence.scoring;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ScoreCurrentJpaRepository extends JpaRepository<ScoreCurrentEntity, String> {
}
