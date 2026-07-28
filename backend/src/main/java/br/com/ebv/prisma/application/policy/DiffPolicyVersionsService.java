package br.com.ebv.prisma.application.policy;

import br.com.ebv.prisma.domain.policy.exception.PolicyNotFoundException;
import br.com.ebv.prisma.domain.policy.port.in.DiffPolicyVersionsUseCase;
import br.com.ebv.prisma.domain.policy.port.out.PolicyVersionRepositoryPort;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.TreeSet;
import java.util.UUID;

@Service
public class DiffPolicyVersionsService implements DiffPolicyVersionsUseCase {

    private final PolicyVersionRepositoryPort repo;
    private final ObjectMapper objectMapper;

    public DiffPolicyVersionsService(PolicyVersionRepositoryPort repo, ObjectMapper objectMapper) {
        this.repo = repo;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional(readOnly = true)
    public Result execute(UUID fromId, UUID toId, boolean includeUnchanged) {
        var from = repo.findById(fromId)
                .orElseThrow(() -> new PolicyNotFoundException("Policy version não encontrada: " + fromId));
        var to = repo.findById(toId)
                .orElseThrow(() -> new PolicyNotFoundException("Policy version não encontrada: " + toId));

        Map<String, Object> fromMap = parseArtifact(from.artifactJson());
        Map<String, Object> toMap = parseArtifact(to.artifactJson());

        Set<String> keys = new TreeSet<>();
        keys.addAll(fromMap.keySet());
        keys.addAll(toMap.keySet());

        List<DiffChange> changes = new ArrayList<>();
        List<String> effects = new ArrayList<>();
        for (String key : keys) {
            Object fv = fromMap.get(key);
            Object tv = toMap.get(key);
            boolean equal = Objects.equals(String.valueOf(fv), String.valueOf(tv));
            if (equal && !includeUnchanged) {
                continue;
            }
            String changeType;
            if (!fromMap.containsKey(key)) {
                changeType = "ADDED";
            } else if (!toMap.containsKey(key)) {
                changeType = "REMOVED";
            } else if (equal) {
                changeType = "UNCHANGED";
            } else {
                changeType = "MODIFIED";
            }
            String effect = businessEffectStub(key, changeType, fv, tv);
            changes.add(new DiffChange(key, fv, tv, changeType, effect));
            if (!"UNCHANGED".equals(changeType)) {
                effects.add(effect);
            }
        }
        return new Result(from.id(), to.id(), from.version(), to.version(), changes, effects);
    }

    private Map<String, Object> parseArtifact(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            throw new IllegalArgumentException("artifact_json inválido: " + e.getMessage());
        }
    }

    static String businessEffectStub(String key, String changeType, Object from, Object to) {
        return switch (changeType) {
            case "ADDED" -> "Novo parâmetro '" + key + "' introduzido com valor " + to + " (efeito de negócio stub).";
            case "REMOVED" -> "Parâmetro '" + key + "' removido (efeito de negócio stub).";
            case "MODIFIED" -> "Alteração em '" + key + "': " + from + " → " + to
                    + " — impacto esperado na elegibilidade (stub).";
            default -> "Sem alteração em '" + key + "'.";
        };
    }
}
