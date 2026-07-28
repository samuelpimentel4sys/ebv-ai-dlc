package br.com.ebv.prisma.infrastructure.adapter.persistence.portfolio;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PfStressRunJpaRepository extends JpaRepository<PfStressRunEntity, String> {
}
