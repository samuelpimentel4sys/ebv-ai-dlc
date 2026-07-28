package br.com.ebv.prisma.application.credential;

import br.com.ebv.prisma.domain.credential.exception.CredentialValidationException;
import br.com.ebv.prisma.domain.credential.port.in.CreateCredentialUseCase;
import br.com.ebv.prisma.domain.credential.port.out.CredentialRepositoryPort;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class CreateCredentialService implements CreateCredentialUseCase {

    private static final List<String> ALLOWED_SCOPES = List.of(
            "credit.score.read", "credit.decision.read", "dispute.write", "console.read"
    );

    private final CredentialRepositoryPort credentialRepo;
    private final ObjectMapper objectMapper;
    private final SecureRandom random = new SecureRandom();

    public CreateCredentialService(CredentialRepositoryPort credentialRepo, ObjectMapper objectMapper) {
        this.credentialRepo = credentialRepo;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional
    public Result execute(Command command) {
        if (command.tenantId() == null || command.tenantId().isBlank()) {
            throw new CredentialValidationException("tenantId obrigatório");
        }
        String env = command.env() == null ? "SANDBOX" : command.env().trim().toUpperCase(Locale.ROOT);
        if (!env.equals("SANDBOX") && !env.equals("PROD")) {
            throw new CredentialValidationException("env deve ser SANDBOX ou PROD");
        }
        List<String> scopes = command.scopes() == null || command.scopes().isEmpty()
                ? List.of("credit.score.read") : command.scopes();
        for (String s : scopes) {
            if (!ALLOWED_SCOPES.contains(s)) {
                throw new CredentialValidationException("scope fora do contrato: " + s);
            }
        }
        int rateLimit = command.rateLimit() == null ? 1000 : command.rateLimit();
        UUID id = UUID.randomUUID();
        String suffix = HexFormat.of().formatHex(randomBytes(4));
        String prefix = env.equals("PROD") ? "ebv_live_prod_" : "ebv_live_test_";
        String clientId = prefix + suffix;
        String secret = (env.equals("PROD") ? "ebv_live_" : "ebv_test_") + HexFormat.of().formatHex(randomBytes(16));
        Instant now = Instant.now();
        credentialRepo.save(new CredentialRepositoryPort.CredentialRecord(
                id, clientId, sha256(secret), toJson(scopes), env, "ACTIVE", rateLimit,
                command.tenantId().trim(), now, null
        ));
        return new Result(id, clientId, secret, scopes, env, "ACTIVE");
    }

    private byte[] randomBytes(int n) {
        byte[] b = new byte[n];
        random.nextBytes(b);
        return b;
    }

    static String sha256(String plain) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(md.digest(plain.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    private String toJson(List<String> scopes) {
        try {
            return objectMapper.writeValueAsString(scopes);
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
