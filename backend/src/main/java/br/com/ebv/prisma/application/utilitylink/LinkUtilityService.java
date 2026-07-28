package br.com.ebv.prisma.application.utilitylink;

import br.com.ebv.prisma.domain.utilitylink.exception.UtilityLinkValidationException;
import br.com.ebv.prisma.domain.utilitylink.port.in.LinkUtilityUseCase;
import br.com.ebv.prisma.domain.utilitylink.port.out.UtilityLinkRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;
import java.util.UUID;

@Service
public class LinkUtilityService implements LinkUtilityUseCase {

    private final UtilityLinkRepositoryPort repo;

    public LinkUtilityService(UtilityLinkRepositoryPort repo) {
        this.repo = repo;
    }

    @Override
    @Transactional
    public Result execute(Command command) {
        if (command.documento() == null || command.documento().isBlank()) {
            throw new UtilityLinkValidationException("documento obrigatório");
        }
        if (command.partnerCode() == null || command.accountRef() == null) {
            throw new UtilityLinkValidationException("partnerCode e accountRef obrigatórios");
        }
        UUID id = UUID.randomUUID();
        String hash = sha256(command.documento().trim());
        // lab stub: always confirms titularidade
        repo.save(new UtilityLinkRepositoryPort.LinkRecord(
                id, hash, command.partnerCode(), command.accountRef(),
                command.utilityType() != null ? command.utilityType() : "ENERGIA",
                "CONFIRMED", Instant.now(), null
        ));
        return new Result(id, "CONFIRMED", true, 0.97);
    }

    static String sha256(String value) {
        try {
            return HexFormat.of().formatHex(
                    MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
