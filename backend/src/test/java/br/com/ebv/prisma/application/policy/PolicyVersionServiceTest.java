package br.com.ebv.prisma.application.policy;

import br.com.ebv.prisma.domain.policy.exception.PolicyConflictException;
import br.com.ebv.prisma.domain.policy.exception.PolicyValidationException;
import br.com.ebv.prisma.domain.policy.port.in.DiffPolicyVersionsUseCase;
import br.com.ebv.prisma.domain.policy.port.in.PublishPolicyVersionUseCase;
import br.com.ebv.prisma.domain.policy.port.out.PolicyVersionRepositoryPort;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PolicyVersionServiceTest {

    @Mock PolicyVersionRepositoryPort repo;

    PublishPolicyVersionService publishService;
    DiffPolicyVersionsService diffService;
    ObjectMapper mapper = new ObjectMapper();

    static final UUID DRAFT_ID = UUID.fromString("a1111111-1111-4111-8111-111111111101");
    static final String ARTIFACT = "{\"max_utilization\":0.7,\"min_score\":650}";
    static final String HASH = "bb3901502201de54ad2940572e58790595f807a8e7f08d378b61b6eddbf7d53d";

    @BeforeEach
    void setUp() {
        publishService = new PublishPolicyVersionService(repo);
        diffService = new DiffPolicyVersionsService(repo, mapper);
    }

    @Test
    @DisplayName("CT-01 publish DRAFT → PUBLISHED immutable")
    void publishDraft() {
        when(repo.findById(DRAFT_ID)).thenReturn(Optional.of(draftRecord()));

        var result = publishService.execute(new PublishPolicyVersionUseCase.Command(
                DRAFT_ID,
                "COMMITTEE-2026-07-42",
                Instant.parse("2026-08-01T00:00:00Z"),
                "Elevação do score mínimo",
                "sha256:" + HASH
        ));

        assertThat(result.status()).isEqualTo("PUBLISHED");
        assertThat(result.artifactHash()).startsWith("sha256:");
        ArgumentCaptor<PolicyVersionRepositoryPort.PolicyVersionRecord> cap =
                ArgumentCaptor.forClass(PolicyVersionRepositoryPort.PolicyVersionRecord.class);
        verify(repo).save(cap.capture());
        assertThat(cap.getValue().immutable()).isTrue();
        assertThat(cap.getValue().status()).isEqualTo("PUBLISHED");
    }

    @Test
    @DisplayName("hash mismatch → 422")
    void hashMismatch() {
        when(repo.findById(DRAFT_ID)).thenReturn(Optional.of(draftRecord()));
        assertThatThrownBy(() -> publishService.execute(new PublishPolicyVersionUseCase.Command(
                DRAFT_ID, "COMMITTEE-1", Instant.parse("2026-08-01T00:00:00Z"), "note", "sha256:deadbeef"
        ))).isInstanceOf(PolicyValidationException.class);
    }

    @Test
    @DisplayName("already published → 409")
    void alreadyPublished() {
        var published = new PolicyVersionRepositoryPort.PolicyVersionRecord(
                DRAFT_ID, "POL-X", "PUBLISHED", ARTIFACT, HASH, "a", "APPROVAL",
                Instant.now(), "note", "git", Instant.now(), Instant.now(), true
        );
        when(repo.findById(DRAFT_ID)).thenReturn(Optional.of(published));
        assertThatThrownBy(() -> publishService.execute(new PublishPolicyVersionUseCase.Command(
                DRAFT_ID, "COMMITTEE-1", Instant.parse("2026-08-01T00:00:00Z"), "note", "sha256:" + HASH
        ))).isInstanceOf(PolicyConflictException.class);
    }

    @Test
    @DisplayName("diff returns business effects")
    void diffEffects() {
        UUID a = UUID.randomUUID();
        UUID b = UUID.randomUUID();
        when(repo.findById(a)).thenReturn(Optional.of(new PolicyVersionRepositoryPort.PolicyVersionRecord(
                a, "v1", "PUBLISHED", "{\"min_score\":650}", "h1", "a", null, null, null, null,
                Instant.now(), Instant.now(), true
        )));
        when(repo.findById(b)).thenReturn(Optional.of(new PolicyVersionRepositoryPort.PolicyVersionRecord(
                b, "v2", "DRAFT", "{\"min_score\":700}", "h2", "a", null, null, null, null,
                Instant.now(), null, false
        )));

        DiffPolicyVersionsUseCase.Result diff = diffService.execute(a, b, false);
        assertThat(diff.changes()).isNotEmpty();
        assertThat(diff.businessEffects()).anyMatch(s -> s.contains("min_score"));
    }

    private static PolicyVersionRepositoryPort.PolicyVersionRecord draftRecord() {
        return new PolicyVersionRepositoryPort.PolicyVersionRecord(
                DRAFT_ID, "POL-2026.08.DRAFT.1", "DRAFT", ARTIFACT, HASH, "analyst.noah",
                null, null, null, null, Instant.parse("2026-07-20T12:00:00Z"), null, false
        );
    }
}
