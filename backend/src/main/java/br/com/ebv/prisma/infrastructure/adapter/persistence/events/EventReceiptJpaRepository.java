package br.com.ebv.prisma.infrastructure.adapter.persistence.events;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface EventReceiptJpaRepository extends JpaRepository<EventReceiptEntity, UUID> {
    Optional<EventReceiptEntity> findByIdempotencyKey(UUID idempotencyKey);
}
