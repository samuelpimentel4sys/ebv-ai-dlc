package br.com.ebv.prisma.domain.identity.port.in;

import br.com.ebv.prisma.domain.identity.model.GoldenRecordId;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface ListCandidatesUseCase {

    record CandidateView(
            UUID id,
            GoldenRecordId leftGr,
            GoldenRecordId rightGr,
            BigDecimal confidence,
            String status
    ) {}

    List<CandidateView> execute();
}
