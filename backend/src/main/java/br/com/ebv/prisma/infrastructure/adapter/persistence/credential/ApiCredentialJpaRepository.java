package br.com.ebv.prisma.infrastructure.adapter.persistence.credential;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ApiCredentialJpaRepository extends JpaRepository<ApiCredentialEntity, UUID> {
}
