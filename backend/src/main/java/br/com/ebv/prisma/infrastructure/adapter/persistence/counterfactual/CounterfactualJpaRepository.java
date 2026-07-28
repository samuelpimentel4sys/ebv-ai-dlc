package br.com.ebv.prisma.infrastructure.adapter.persistence.counterfactual;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface CounterfactualJpaRepository extends JpaRepository<CounterfactualEntity, UUID> {
}
