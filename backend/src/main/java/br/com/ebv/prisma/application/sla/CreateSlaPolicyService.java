package br.com.ebv.prisma.application.sla;

import br.com.ebv.prisma.domain.sla.exception.SlaConflictException;
import br.com.ebv.prisma.domain.sla.exception.SlaValidationException;
import br.com.ebv.prisma.domain.sla.port.in.CreateSlaPolicyUseCase;
import br.com.ebv.prisma.domain.sla.port.out.SlaRepositoryPort;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class CreateSlaPolicyService implements CreateSlaPolicyUseCase {

    private final SlaRepositoryPort slaRepo;
    private final ObjectMapper objectMapper;

    public CreateSlaPolicyService(SlaRepositoryPort slaRepo, ObjectMapper objectMapper) {
        this.slaRepo = slaRepo;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional
    public Result execute(Command command) {
        if (command.name() == null || command.name().isBlank()) {
            throw new SlaValidationException("name obrigatório");
        }
        if (command.escalateAtPct() < 1 || command.escalateAtPct() > 100) {
            throw new SlaValidationException("escalateAtPct deve estar entre 1 e 100");
        }
        if (slaRepo.findActivePolicy().isPresent()) {
            throw new SlaConflictException("Já existe política ACTIVE — desative a atual antes de criar outra");
        }
        List<String> channels = command.notifyChannels() == null || command.notifyChannels().isEmpty()
                ? List.of("EMAIL") : command.notifyChannels();
        UUID id = UUID.randomUUID();
        Instant now = Instant.now();
        String json = toJson(channels);
        slaRepo.savePolicy(new SlaRepositoryPort.PolicyRecord(
                id, command.name().trim(), command.escalateAtPct(), json, "ACTIVE", now
        ));
        return new Result(id, command.name().trim(), command.escalateAtPct(), channels, "ACTIVE", now);
    }

    private String toJson(List<String> channels) {
        try {
            return objectMapper.writeValueAsString(channels);
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
