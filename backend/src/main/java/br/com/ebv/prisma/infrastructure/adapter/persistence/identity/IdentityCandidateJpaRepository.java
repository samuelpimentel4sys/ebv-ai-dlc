package br.com.ebv.prisma.infrastructure.adapter.persistence.identity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface IdentityCandidateJpaRepository extends JpaRepository<IdentityCandidateEntity, UUID> {

    List<IdentityCandidateEntity> findByStatusOrderByCreatedAtDesc(String status);

    @Query("""
        select c from IdentityCandidateEntity c
        where (c.leftGr = :a and c.rightGr = :b) or (c.leftGr = :b and c.rightGr = :a)
        """)
    Optional<IdentityCandidateEntity> findPair(@Param("a") UUID a, @Param("b") UUID b);
}
