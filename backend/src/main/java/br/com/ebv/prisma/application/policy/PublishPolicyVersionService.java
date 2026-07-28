package br.com.ebv.prisma.application.policy;

import br.com.ebv.prisma.application.decision.SnapshotHash;
import br.com.ebv.prisma.domain.policy.exception.PolicyConflictException;
import br.com.ebv.prisma.domain.policy.exception.PolicyNotFoundException;
import br.com.ebv.prisma.domain.policy.exception.PolicyValidationException;
import br.com.ebv.prisma.domain.policy.port.in.PublishPolicyVersionUseCase;
import br.com.ebv.prisma.domain.policy.port.out.PolicyVersionRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Locale;

@Service
public class PublishPolicyVersionService implements PublishPolicyVersionUseCase {

    static final String STATUS_DRAFT = "DRAFT";
    static final String STATUS_PUBLISHED = "PUBLISHED";

    private final PolicyVersionRepositoryPort repo;

    public PublishPolicyVersionService(PolicyVersionRepositoryPort repo) {
        this.repo = repo;
    }

    @Override
    @Transactional
    public Result execute(Command command) {
        var current = repo.findById(command.id())
                .orElseThrow(() -> new PolicyNotFoundException("Policy version não encontrada: " + command.id()));

        // RN001 — já publicada / imutável → 409
        if (STATUS_PUBLISHED.equalsIgnoreCase(current.status()) || current.immutable()) {
            throw new PolicyConflictException("Versão já publicada é imutável (RN001)");
        }
        if (!STATUS_DRAFT.equalsIgnoreCase(current.status())) {
            throw new PolicyConflictException("Somente DRAFT pode ser publicado; status atual=" + current.status());
        }

        if (command.approvalId() == null || command.approvalId().isBlank()) {
            throw new PolicyValidationException("approval_id obrigatório (CA-04)");
        }
        if (command.effectiveAt() == null) {
            throw new PolicyValidationException("effective_at obrigatório");
        }

        String computed = SnapshotHash.sha256Hex(current.artifactJson() == null ? "" : current.artifactJson());
        String expected = normalizeHash(command.expectedDraftHash());
        if (expected == null || expected.isBlank()) {
            throw new PolicyValidationException("expected_draft_hash obrigatório");
        }
        if (!computed.equalsIgnoreCase(expected)) {
            throw new PolicyValidationException(
                    "expected_draft_hash diverge do SHA-256 do artefato (computed=sha256:" + computed + ")"
            );
        }

        Instant now = Instant.now();
        String gitCommit = "lab" + computed.substring(0, Math.min(36, computed.length()));
        String hashPrefixed = "sha256:" + computed;

        var published = new PolicyVersionRepositoryPort.PolicyVersionRecord(
                current.id(),
                current.version(),
                STATUS_PUBLISHED,
                current.artifactJson(),
                hashPrefixed,
                current.author(),
                command.approvalId().trim(),
                command.effectiveAt(),
                command.releaseNote(),
                gitCommit,
                current.createdAt(),
                now,
                true
        );
        repo.save(published);

        return new Result(
                published.id(),
                published.version(),
                STATUS_PUBLISHED,
                hashPrefixed,
                gitCommit,
                "committee:" + command.approvalId().trim().toLowerCase(Locale.ROOT),
                command.effectiveAt()
        );
    }

    static String normalizeHash(String raw) {
        if (raw == null) {
            return null;
        }
        String t = raw.trim();
        if (t.regionMatches(true, 0, "sha256:", 0, 7)) {
            return t.substring(7).trim();
        }
        return t;
    }
}
