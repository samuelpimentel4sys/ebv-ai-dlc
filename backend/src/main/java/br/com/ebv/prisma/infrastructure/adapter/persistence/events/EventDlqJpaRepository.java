package br.com.ebv.prisma.infrastructure.adapter.persistence.events;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface EventDlqJpaRepository extends JpaRepository<EventDlqEntity, UUID> {
}
