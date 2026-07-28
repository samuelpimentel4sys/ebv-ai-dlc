package br.com.ebv.prisma.application.subjectrequest;

import br.com.ebv.prisma.domain.subjectrequest.exception.SubjectRequestConflictException;
import br.com.ebv.prisma.domain.subjectrequest.exception.SubjectRequestNotFoundException;
import br.com.ebv.prisma.domain.subjectrequest.exception.SubjectRequestValidationException;
import br.com.ebv.prisma.domain.subjectrequest.port.in.PatchSubjectRequestUseCase;
import br.com.ebv.prisma.domain.subjectrequest.port.out.SubjectRequestRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Locale;
import java.util.Set;

@Service
public class PatchSubjectRequestService implements PatchSubjectRequestUseCase {

    public static final String STATUS_OPEN = "OPEN";
    public static final String STATUS_IN_PROGRESS = "IN_PROGRESS";
    public static final String STATUS_COMPLETED = "COMPLETED";
    public static final String STATUS_REJECTED = "REJECTED";

    private static final Set<String> ACTIONS = Set.of("START", "COMPLETE", "REJECT");

    private final SubjectRequestRepositoryPort repo;

    public PatchSubjectRequestService(SubjectRequestRepositoryPort repo) {
        this.repo = repo;
    }

    @Override
    @Transactional
    public Result execute(Command command) {
        if (command.id() == null) {
            throw new IllegalArgumentException("id obrigatório");
        }
        if (command.action() == null || command.action().isBlank()) {
            throw new SubjectRequestValidationException("action obrigatório");
        }

        String action = command.action().trim().toUpperCase(Locale.ROOT);
        if (!ACTIONS.contains(action)) {
            throw new SubjectRequestValidationException("action deve ser START, COMPLETE ou REJECT");
        }

        var existing = repo.findById(command.id())
                .orElseThrow(() -> new SubjectRequestNotFoundException(command.id()));

        if (STATUS_COMPLETED.equals(existing.status()) || STATUS_REJECTED.equals(existing.status())) {
            throw new SubjectRequestConflictException("Requisição já finalizada: " + existing.status());
        }

        Instant now = Instant.now();
        String newStatus;
        String summary = command.responseSummary();
        switch (action) {
            case "START" -> newStatus = STATUS_IN_PROGRESS;
            case "COMPLETE" -> {
                if (summary == null || summary.isBlank()) {
                    throw new SubjectRequestValidationException("response_summary obrigatório para COMPLETE");
                }
                newStatus = STATUS_COMPLETED;
            }
            case "REJECT" -> {
                if (summary == null || summary.isBlank()) {
                    throw new SubjectRequestValidationException("response_summary obrigatório para REJECT");
                }
                newStatus = STATUS_REJECTED;
            }
            default -> throw new SubjectRequestValidationException("action inválida");
        }

        repo.save(new SubjectRequestRepositoryPort.SubjectRequestRecord(
                existing.id(),
                existing.rightType(),
                existing.subjectToken(),
                existing.channel(),
                existing.description(),
                newStatus,
                existing.dueAt(),
                summary != null ? summary.trim() : existing.responseSummary(),
                command.attachmentId() != null ? command.attachmentId() : existing.attachmentId(),
                existing.createdAt(),
                now
        ));

        return new Result(
                existing.id(), existing.rightType(), newStatus, existing.dueAt(),
                summary != null ? summary.trim() : existing.responseSummary(),
                command.attachmentId() != null ? command.attachmentId() : existing.attachmentId(),
                now
        );
    }
}
