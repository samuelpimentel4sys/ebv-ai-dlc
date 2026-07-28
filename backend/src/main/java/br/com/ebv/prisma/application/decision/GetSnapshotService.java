package br.com.ebv.prisma.application.decision;

import br.com.ebv.prisma.domain.decision.exception.DecisionNotFoundException;
import br.com.ebv.prisma.domain.decision.exception.SnapshotUnavailableException;
import br.com.ebv.prisma.domain.decision.port.in.GetSnapshotUseCase;
import br.com.ebv.prisma.domain.decision.port.out.DecisionRepositoryPort;
import br.com.ebv.prisma.domain.decision.port.out.WormStoragePort;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

@Service
public class GetSnapshotService implements GetSnapshotUseCase {

    private final DecisionRepositoryPort decisionRepo;
    private final WormStoragePort wormStorage;
    private final ObjectMapper objectMapper;

    public GetSnapshotService(
            DecisionRepositoryPort decisionRepo,
            WormStoragePort wormStorage,
            ObjectMapper objectMapper
    ) {
        this.decisionRepo = decisionRepo;
        this.wormStorage = wormStorage;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> execute(UUID decisionId) {
        decisionRepo.findById(decisionId)
                .orElseThrow(() -> new DecisionNotFoundException(decisionId));

        String json = wormStorage.get(decisionId)
                .orElseThrow(() -> new SnapshotUnavailableException(
                        "Snapshot WORM indisponível: " + decisionId
                ));
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            throw new SnapshotUnavailableException("Snapshot corrompido: " + decisionId);
        }
    }
}
