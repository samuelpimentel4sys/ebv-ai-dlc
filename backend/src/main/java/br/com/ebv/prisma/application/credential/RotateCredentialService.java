package br.com.ebv.prisma.application.credential;

import br.com.ebv.prisma.domain.credential.exception.CredentialConflictException;
import br.com.ebv.prisma.domain.credential.exception.CredentialNotFoundException;
import br.com.ebv.prisma.domain.credential.port.in.RotateCredentialUseCase;
import br.com.ebv.prisma.domain.credential.port.out.CredentialRepositoryPort;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

@Service
public class RotateCredentialService implements RotateCredentialUseCase {

    private final CredentialRepositoryPort credentialRepo;
    private final ObjectMapper objectMapper;
    private final SecureRandom random = new SecureRandom();

    public RotateCredentialService(CredentialRepositoryPort credentialRepo, ObjectMapper objectMapper) {
        this.credentialRepo = credentialRepo;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional
    public Result execute(Command command) {
        var existing = credentialRepo.findById(command.id())
                .orElseThrow(() -> new CredentialNotFoundException("Credencial não encontrada: " + command.id()));
        if ("REVOKED".equals(existing.status())) {
            throw new CredentialConflictException("Credencial REVOKED não pode rotacionar");
        }
        String secretPrefix = "PROD".equals(existing.env()) ? "ebv_live_" : "ebv_test_";
        byte[] bytes = new byte[16];
        random.nextBytes(bytes);
        String secret = secretPrefix + HexFormat.of().formatHex(bytes);
        Instant now = Instant.now();
        credentialRepo.save(new CredentialRepositoryPort.CredentialRecord(
                existing.id(),
                existing.clientId(),
                CreateCredentialService.sha256(secret),
                existing.scopesJson(),
                existing.env(),
                "ACTIVE",
                existing.rateLimit(),
                existing.tenantId(),
                existing.createdAt(),
                now
        ));
        List<String> scopes = parseScopes(existing.scopesJson());
        return new Result(existing.id(), existing.clientId(), secret, scopes, "ACTIVE");
    }

    private List<String> parseScopes(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            return List.of();
        }
    }
}
