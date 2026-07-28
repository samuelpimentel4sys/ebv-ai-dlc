package br.com.ebv.prisma.infrastructure.adapter.persistence.observability;

import org.springframework.data.jpa.repository.JpaRepository;

public interface SloSnapshotJpaRepository extends JpaRepository<SloSnapshotEntity, Long> {
}
