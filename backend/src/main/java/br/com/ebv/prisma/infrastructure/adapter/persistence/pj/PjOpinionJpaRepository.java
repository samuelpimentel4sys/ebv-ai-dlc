package br.com.ebv.prisma.infrastructure.adapter.persistence.pj;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface PjOpinionJpaRepository extends JpaRepository<PjOpinionEntity, UUID> {}
