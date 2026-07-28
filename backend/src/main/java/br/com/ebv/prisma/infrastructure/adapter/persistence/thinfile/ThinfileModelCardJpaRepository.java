package br.com.ebv.prisma.infrastructure.adapter.persistence.thinfile;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ThinfileModelCardJpaRepository extends JpaRepository<ThinfileModelCardEntity, String> {
    Optional<ThinfileModelCardEntity> findFirstByActiveTrue();
}
