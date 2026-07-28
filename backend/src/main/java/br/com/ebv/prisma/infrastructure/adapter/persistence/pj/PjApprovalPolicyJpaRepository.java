package br.com.ebv.prisma.infrastructure.adapter.persistence.pj;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface PjApprovalPolicyJpaRepository extends JpaRepository<PjApprovalPolicyEntity, UUID> {

    @Query("""
            SELECT p FROM PjApprovalPolicyEntity p
            WHERE p.minAmount <= :amount
              AND (p.maxAmount IS NULL OR p.maxAmount >= :amount)
            ORDER BY p.minAmount DESC
            """)
    List<PjApprovalPolicyEntity> findMatching(@Param("amount") BigDecimal amount);

    List<PjApprovalPolicyEntity> findAllByOrderByMinAmountAsc();
}
