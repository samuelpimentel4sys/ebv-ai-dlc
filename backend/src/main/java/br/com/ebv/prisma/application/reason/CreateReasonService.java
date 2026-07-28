package br.com.ebv.prisma.application.reason;

import br.com.ebv.prisma.domain.reason.exception.ReasonValidationException;
import br.com.ebv.prisma.domain.reason.port.in.CreateReasonUseCase;
import br.com.ebv.prisma.domain.reason.port.out.ReasonVersionRepositoryPort;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class CreateReasonService implements CreateReasonUseCase {

    static final String STATUS_DRAFT = "DRAFT";

    private final ReasonVersionRepositoryPort repo;
    private final ObjectMapper objectMapper;

    public CreateReasonService(ReasonVersionRepositoryPort repo, ObjectMapper objectMapper) {
        this.repo = repo;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional
    public Result execute(Command command) {
        if (command.code() == null || command.code().isBlank()) {
            throw new ReasonValidationException("code obrigatório");
        }
        if (command.consumerText() == null || command.consumerText().isBlank()) {
            throw new ReasonValidationException("consumer_text obrigatório");
        }
        if (command.analystText() == null || command.analystText().isBlank()) {
            throw new ReasonValidationException("analyst_text obrigatório");
        }

        String code = command.code().trim().toUpperCase(Locale.ROOT);
        int nextVersion = repo.findMaxVersion(code).orElse(0) + 1;
        Instant now = Instant.now();
        UUID id = UUID.randomUUID();

        List<String> channels = command.channels() == null || command.channels().isEmpty()
                ? List.of("APP", "PORTAL", "LETTER")
                : command.channels();

        String channelsJson = writeJson(channels);
        String mappingsJson = writeJson(command.mappings() == null ? List.of() : command.mappings());

        repo.save(new ReasonVersionRepositoryPort.ReasonVersionRecord(
                id, code, nextVersion, STATUS_DRAFT,
                command.consumerText().trim(), command.analystText().trim(),
                channelsJson, mappingsJson, null, now
        ));

        return new Result(id, code, nextVersion, STATUS_DRAFT, null, now);
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            throw new IllegalStateException("Falha serialização JSON: " + e.getMessage(), e);
        }
    }
}
