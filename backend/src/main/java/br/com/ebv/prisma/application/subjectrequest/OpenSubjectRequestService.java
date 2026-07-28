package br.com.ebv.prisma.application.subjectrequest;

import br.com.ebv.prisma.domain.subjectrequest.exception.SubjectRequestValidationException;
import br.com.ebv.prisma.domain.subjectrequest.port.in.OpenSubjectRequestUseCase;
import br.com.ebv.prisma.domain.subjectrequest.port.out.SubjectRequestRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class OpenSubjectRequestService implements OpenSubjectRequestUseCase {

    public static final String STATUS_OPEN = "OPEN";
    private static final Set<String> RIGHT_TYPES = Set.of(
            "ACCESS", "DELETION", "CORRECTION", "PORTABILITY", "OPPOSITION", "ANONYMIZATION"
    );
    /** Lab stub due days by right_type (US RN002). */
    private static final Map<String, Integer> DUE_DAYS = Map.of(
            "ACCESS", 15,
            "CORRECTION", 15,
            "PORTABILITY", 15,
            "OPPOSITION", 15,
            "ANONYMIZATION", 15,
            "DELETION", 30
    );

    private final SubjectRequestRepositoryPort repo;

    public OpenSubjectRequestService(SubjectRequestRepositoryPort repo) {
        this.repo = repo;
    }

    @Override
    @Transactional
    public Result execute(Command command) {
        if (command.rightType() == null || command.rightType().isBlank()) {
            throw new SubjectRequestValidationException("right_type obrigatório");
        }
        if (command.subjectToken() == null || command.subjectToken().isBlank()) {
            throw new IllegalArgumentException("subject_token obrigatório");
        }
        if (command.channel() == null || command.channel().isBlank()) {
            throw new IllegalArgumentException("channel obrigatório");
        }
        if (command.description() == null || command.description().isBlank()) {
            throw new IllegalArgumentException("description obrigatório");
        }

        String rightType = command.rightType().trim().toUpperCase(Locale.ROOT);
        if (!RIGHT_TYPES.contains(rightType)) {
            throw new SubjectRequestValidationException("right_type inválido: " + rightType);
        }

        UUID id = UUID.randomUUID();
        Instant now = Instant.now();
        int days = DUE_DAYS.getOrDefault(rightType, 15);
        Instant dueAt = now.plus(days, ChronoUnit.DAYS);

        repo.save(new SubjectRequestRepositoryPort.SubjectRequestRecord(
                id, rightType, command.subjectToken().trim(),
                command.channel().trim().toUpperCase(Locale.ROOT),
                command.description().trim(), STATUS_OPEN, dueAt,
                null, null, now, now
        ));

        return new Result(id, rightType, STATUS_OPEN, dueAt, now);
    }
}
