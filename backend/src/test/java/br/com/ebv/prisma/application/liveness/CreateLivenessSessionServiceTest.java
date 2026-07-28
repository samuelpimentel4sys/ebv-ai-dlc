package br.com.ebv.prisma.application.liveness;

import br.com.ebv.prisma.domain.liveness.exception.LivenessConflictException;
import br.com.ebv.prisma.domain.liveness.exception.LivenessLockoutException;
import br.com.ebv.prisma.domain.liveness.exception.LivenessPreconditionException;
import br.com.ebv.prisma.domain.liveness.port.in.CreateLivenessSessionUseCase;
import br.com.ebv.prisma.domain.liveness.port.out.LivenessRepositoryPort;
import br.com.ebv.prisma.domain.liveness.port.out.RekognitionLivenessPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CreateLivenessSessionServiceTest {

    @Mock LivenessRepositoryPort repo;
    @Mock RekognitionLivenessPort rekognition;

    CreateLivenessSessionService service;
    UUID customer = UUID.fromString("9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d");

    @BeforeEach
    void setUp() {
        service = new CreateLivenessSessionService(repo, rekognition);
    }

    @Test
    void ca01_createsSessionWhenConsentOk() {
        when(repo.hasActiveConsent(customer)).thenReturn(true);
        when(repo.hasActiveLockout(customer)).thenReturn(false);
        when(rekognition.createSession(any(), any())).thenReturn(new RekognitionLivenessPort.CreatedSession("aws-session-1"));
        when(repo.saveSession(any())).thenAnswer(inv -> inv.getArgument(0));

        var r = service.execute(new CreateLivenessSessionUseCase.Command(
                customer, customer,
                new CreateLivenessSessionUseCase.DeviceInfo("iOS", "2.14.0", "1.1.1.1", "dev-1"),
                "MOBILE_APP", null, "hash"
        ));

        assertEquals("aws-session-1", r.sessionId());
        assertEquals("CREATED", r.status());
        assertTrue(r.expiresAt().isAfter(r.createdAt()));
        ArgumentCaptor<LivenessRepositoryPort.SessionView> cap = ArgumentCaptor.forClass(LivenessRepositoryPort.SessionView.class);
        verify(repo).saveSession(cap.capture());
        assertEquals("MOBILE_APP", cap.getValue().channel());
    }

    @Test
    void ca04_blocksWithoutConsent() {
        when(repo.hasActiveConsent(customer)).thenReturn(false);
        assertThrows(LivenessPreconditionException.class, () -> service.execute(cmd(null, "h")));
    }

    @Test
    void ca07_blocksOnLockout() {
        when(repo.hasActiveConsent(customer)).thenReturn(true);
        when(repo.hasActiveLockout(customer)).thenReturn(true);
        assertThrows(LivenessLockoutException.class, () -> service.execute(cmd(null, "h")));
    }

    @Test
    void ca02_idempotentReturnsCache() {
        when(repo.hasActiveConsent(customer)).thenReturn(true);
        when(repo.hasActiveLockout(customer)).thenReturn(false);
        when(repo.findIdempotentPayloadHash("k1")).thenReturn(Optional.of("h"));
        Instant now = Instant.now();
        when(repo.findIdempotent("k1")).thenReturn(Optional.of(
                new LivenessRepositoryPort.IdempotentPayload("cached", customer, "CREATED", now, now.plusSeconds(180))
        ));

        var r = service.execute(cmd("k1", "h"));
        assertEquals("cached", r.sessionId());
        assertTrue(r.fromCache());
    }

    @Test
    void ca03_idempotentConflictOnHash() {
        when(repo.hasActiveConsent(customer)).thenReturn(true);
        when(repo.hasActiveLockout(customer)).thenReturn(false);
        when(repo.findIdempotentPayloadHash("k1")).thenReturn(Optional.of("other"));
        assertThrows(LivenessConflictException.class, () -> service.execute(cmd("k1", "h")));
    }

    private CreateLivenessSessionUseCase.Command cmd(String key, String hash) {
        return new CreateLivenessSessionUseCase.Command(
                customer, null, null, "MOBILE_APP", key, hash
        );
    }
}
