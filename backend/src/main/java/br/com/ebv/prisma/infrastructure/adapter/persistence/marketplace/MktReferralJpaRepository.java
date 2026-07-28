package br.com.ebv.prisma.infrastructure.adapter.persistence.marketplace;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface MktReferralJpaRepository extends JpaRepository<MktReferralEntity, UUID> {}
