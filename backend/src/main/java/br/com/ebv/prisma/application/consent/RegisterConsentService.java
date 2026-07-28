package br.com.ebv.prisma.application.consent;

import br.com.ebv.prisma.domain.consent.exception.ConsentValidationException;
import br.com.ebv.prisma.domain.consent.port.in.RegisterConsentUseCase;
import br.com.ebv.prisma.domain.consent.port.out.ConsentRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

@Service
public class RegisterConsentService implements RegisterConsentUseCase {

    private final ConsentRepositoryPort repo;

    public RegisterConsentService(ConsentRepositoryPort repo) {
        this.repo = repo;
    }

    @Override
    @Transactional
    public Result execute(Command command) {
        if (command.documento() == null || command.documento().isBlank()) {
            throw new ConsentValidationException("documento obrigatório");
        }
        if (command.items() == null || command.items().isEmpty()) {
            throw new ConsentValidationException("items obrigatório");
        }
        String hash = sha256(command.documento().trim());
        Instant now = Instant.now();
        List<ResultItem> out = new ArrayList<>();
        for (Item item : command.items()) {
            if (!item.accepted()) {
                out.add(new ResultItem(null, item.purposeCode(), item.sourceCode(), "DECLINED"));
                continue;
            }
            UUID id = UUID.randomUUID();
            repo.save(new ConsentRepositoryPort.ConsentRecord(
                    id, hash, item.purposeCode(), item.sourceCode(), "ACTIVE",
                    now, null, item.validTo(),
                    command.channel() != null ? command.channel() : "MOBILE_APP",
                    command.versionTermo() != null ? command.versionTermo() : "v1.0"
            ));
            out.add(new ResultItem(id, item.purposeCode(), item.sourceCode(), "ACTIVE"));
        }
        return new Result(hash, out);
    }

    static String sha256(String value) {
        try {
            byte[] dig = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(dig);
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
