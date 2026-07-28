package br.com.ebv.prisma.application.thinfile;

import br.com.ebv.prisma.domain.thinfile.exception.ThinfileValidationException;
import br.com.ebv.prisma.domain.thinfile.port.in.CalculateThinfileScoreUseCase;
import br.com.ebv.prisma.domain.thinfile.port.out.ThinfileRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;
import java.util.UUID;

@Service
public class CalculateThinfileScoreService implements CalculateThinfileScoreUseCase {

    private final ThinfileRepositoryPort repo;

    public CalculateThinfileScoreService(ThinfileRepositoryPort repo) { this.repo = repo; }

    @Override
    @Transactional
    public Result execute(Command command) {
        if (command.documento() == null || command.documento().isBlank()) {
            throw new ThinfileValidationException("documento obrigatório");
        }
        int history = command.traditionalHistoryCount() != null ? command.traditionalHistoryCount() : 0;
        boolean thin = history < 3;
        var card = repo.findActiveModelCard().orElseThrow(() ->
                new ThinfileValidationException("model card ativo ausente"));
        UUID id = UUID.randomUUID();
        int score = thin ? 520 : 650;
        String band = thin ? "MEDIUM" : "HIGH";
        repo.saveScore(new ThinfileRepositoryPort.ScoreRecord(
                id, sha256(command.documento().trim()), card.modelVersion(), score, band,
                thin, !thin, Instant.now(), UUID.randomUUID()
        ));
        return new Result(id, score, band, thin, !thin, card.modelVersion());
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
