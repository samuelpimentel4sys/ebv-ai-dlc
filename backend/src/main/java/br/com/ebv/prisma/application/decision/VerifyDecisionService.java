package br.com.ebv.prisma.application.decision;

import br.com.ebv.prisma.domain.decision.exception.ChainBrokenException;
import br.com.ebv.prisma.domain.decision.exception.DecisionNotFoundException;
import br.com.ebv.prisma.domain.decision.exception.SnapshotUnavailableException;
import br.com.ebv.prisma.domain.decision.port.in.VerifyDecisionUseCase;
import br.com.ebv.prisma.domain.decision.port.out.DecisionRepositoryPort;
import br.com.ebv.prisma.domain.decision.port.out.WormStoragePort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;
import java.util.UUID;

@Service
public class VerifyDecisionService implements VerifyDecisionUseCase {

    private final DecisionRepositoryPort decisionRepo;
    private final WormStoragePort wormStorage;

    public VerifyDecisionService(DecisionRepositoryPort decisionRepo, WormStoragePort wormStorage) {
        this.decisionRepo = decisionRepo;
        this.wormStorage = wormStorage;
    }

    @Override
    @Transactional(readOnly = true)
    public Result execute(UUID decisionId, boolean checkChain) {
        var record = decisionRepo.findById(decisionId)
                .orElseThrow(() -> new DecisionNotFoundException(decisionId));

        String storedJson = wormStorage.get(decisionId)
                .orElseThrow(() -> new SnapshotUnavailableException(
                        "Snapshot WORM indisponível: " + decisionId
                ));

        String recomputed = SnapshotHash.sha256Hex(storedJson);
        boolean hashValid = Objects.equals(recomputed, record.sha256());

        boolean chainValid = true;
        if (checkChain) {
            chainValid = verifyChain(record);
            if (!chainValid) {
                throw new ChainBrokenException(
                        "Cadeia SHA-256 quebrada para decisionId=" + decisionId
                );
            }
        }

        String integrity = hashValid ? "VALID" : "INVALID";
        return new Result(decisionId, integrity, chainValid, record.sha256(), record.lockedUntil());
    }

    /**
     * RN002: prev_sha256 must match the immediately previous decision for the same documento,
     * or be null when this is the first decision.
     */
    private boolean verifyChain(DecisionRepositoryPort.DecisionRecord record) {
        var previous = decisionRepo.findPreviousByDocumento(record.documento(), record.createdAt());
        if (record.prevSha256() == null) {
            return previous.isEmpty();
        }
        if (previous.isEmpty()) {
            return false;
        }
        return Objects.equals(record.prevSha256(), previous.get().sha256())
                && decisionRepo.findBySha256(record.prevSha256()).isPresent();
    }
}
