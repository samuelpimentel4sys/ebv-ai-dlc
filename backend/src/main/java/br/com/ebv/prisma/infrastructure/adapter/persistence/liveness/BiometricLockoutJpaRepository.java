package br.com.ebv.prisma.infrastructure.adapter.persistence.liveness;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.UUID;

public interface BiometricLockoutJpaRepository extends JpaRepository<BiometricLockoutEntity, UUID> {

    @Query("""
            select count(l) > 0 from BiometricLockoutEntity l
            where l.customerId = :customerId and l.status = 'ACTIVE' and l.lockedUntil > :now
            """)
    boolean existsActiveLockout(@Param("customerId") UUID customerId, @Param("now") Instant now);
}
