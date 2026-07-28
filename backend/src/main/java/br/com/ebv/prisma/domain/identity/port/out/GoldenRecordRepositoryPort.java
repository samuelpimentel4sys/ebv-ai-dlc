package br.com.ebv.prisma.domain.identity.port.out;

import br.com.ebv.prisma.domain.identity.model.DocumentoCanonico;
import br.com.ebv.prisma.domain.identity.model.GoldenRecord;
import br.com.ebv.prisma.domain.identity.model.GoldenRecordId;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface GoldenRecordRepositoryPort {

    Optional<GoldenRecord> findActiveByDocumento(DocumentoCanonico documento);

    Optional<GoldenRecord> findById(GoldenRecordId id);

    GoldenRecord save(GoldenRecord record);

    boolean wouldCreateCycle(GoldenRecordId survivor, GoldenRecordId merged);

    void appendMergeTrail(String action, GoldenRecordId from, GoldenRecordId to, UUID actor);

    /** True se existe MERGE de merged→survivor sem UNDO posterior do mesmo par. */
    boolean hasOpenMerge(GoldenRecordId merged, GoldenRecordId survivor);

    void reassignLinks(GoldenRecordId from, GoldenRecordId to);

    record CandidateRecord(UUID id, GoldenRecordId left, GoldenRecordId right, java.math.BigDecimal confidence, String status) {}

    UUID enqueueCandidate(GoldenRecordId left, GoldenRecordId right, java.math.BigDecimal confidence);

    List<CandidateRecord> listPendingCandidates();

    void resolveCandidate(GoldenRecordId left, GoldenRecordId right);
}
