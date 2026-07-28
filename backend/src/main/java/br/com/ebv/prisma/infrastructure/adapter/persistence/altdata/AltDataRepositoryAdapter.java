package br.com.ebv.prisma.infrastructure.adapter.persistence.altdata;

import br.com.ebv.prisma.domain.altdata.port.out.AltDataRepositoryPort;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;

@Component
@Transactional
public class AltDataRepositoryAdapter implements AltDataRepositoryPort {

    private final AltDataBatchJpaRepository jpa;

    public AltDataRepositoryAdapter(AltDataBatchJpaRepository jpa) { this.jpa = jpa; }

    @Override
    public void save(BatchRecord record) {
        AltDataBatchEntity e = new AltDataBatchEntity();
        e.setBatchId(record.batchId());
        e.setPartnerCode(record.partnerCode());
        e.setUtilityType(record.utilityType());
        e.setSourceUri(record.sourceUri());
        e.setReceivedAt(OffsetDateTime.ofInstant(record.receivedAt(), ZoneOffset.UTC));
        e.setRecordCount(record.recordCount());
        e.setErrorRate(record.errorRate());
        e.setQualityLimit(record.qualityLimit());
        e.setStatus(record.status());
        e.setRejectionReason(record.rejectionReason());
        e.setCorrelationId(record.correlationId());
        e.setCreatedAt(OffsetDateTime.now(ZoneOffset.UTC));
        jpa.save(e);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BatchRecord> findRecent(int limit) {
        return jpa.findTop20ByOrderByReceivedAtDesc().stream().limit(limit).map(e -> new BatchRecord(
                e.getBatchId(), e.getPartnerCode(), e.getUtilityType(), e.getSourceUri(),
                e.getReceivedAt().toInstant(), e.getRecordCount(), e.getErrorRate(), e.getQualityLimit(),
                e.getStatus(), e.getRejectionReason(), e.getCorrelationId()
        )).toList();
    }
}
