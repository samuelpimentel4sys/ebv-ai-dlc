package br.com.ebv.prisma.presentation.dto.identity;

import java.math.BigDecimal;
import java.util.UUID;

public record CandidateResponse(
        UUID id,
        UUID leftGrId,
        UUID rightGrId,
        BigDecimal confidence,
        String status
) {}
