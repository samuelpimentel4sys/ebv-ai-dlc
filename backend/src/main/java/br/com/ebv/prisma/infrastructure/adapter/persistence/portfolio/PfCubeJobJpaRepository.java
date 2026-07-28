package br.com.ebv.prisma.infrastructure.adapter.persistence.portfolio;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PfCubeJobJpaRepository extends JpaRepository<PfCubeJobEntity, String> {
}
