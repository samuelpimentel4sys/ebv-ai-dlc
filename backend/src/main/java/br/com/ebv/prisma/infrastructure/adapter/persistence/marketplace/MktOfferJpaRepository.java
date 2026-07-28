package br.com.ebv.prisma.infrastructure.adapter.persistence.marketplace;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MktOfferJpaRepository extends JpaRepository<MktOfferEntity, UUID> {
    List<MktOfferEntity> findByActiveTrue();
}
