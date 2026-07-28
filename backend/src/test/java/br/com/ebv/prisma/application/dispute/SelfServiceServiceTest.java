package br.com.ebv.prisma.application.dispute;

import br.com.ebv.prisma.domain.dispute.exception.DisputeLockoutException;
import br.com.ebv.prisma.domain.dispute.exception.DisputeUnauthorizedException;
import br.com.ebv.prisma.domain.dispute.exception.DisputeValidationException;
import br.com.ebv.prisma.domain.dispute.port.in.IdentifySelfServiceUseCase;
import br.com.ebv.prisma.domain.dispute.port.in.ListSelfServiceRecordsUseCase;
import br.com.ebv.prisma.domain.dispute.port.in.OpenDisputeUseCase;
import br.com.ebv.prisma.domain.dispute.port.in.OpenSelfServiceDisputeUseCase;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SelfServiceServiceTest {

    InMemoryDisputeLockoutAdapter lockout;
    InMemorySelfServiceSessionAdapter sessions;
    @Mock OpenDisputeUseCase openDispute;

    IdentifySelfServiceService identify;
    ListSelfServiceRecordsService listRecords;
    OpenSelfServiceDisputeService openSelf;

    @BeforeEach
    void setUp() {
        lockout = new InMemoryDisputeLockoutAdapter();
        sessions = new InMemorySelfServiceSessionAdapter();
        identify = new IdentifySelfServiceService(sessions, lockout);
        listRecords = new ListSelfServiceRecordsService(sessions);
        openSelf = new OpenSelfServiceDisputeService(sessions, openDispute);
    }

    @Test
    @DisplayName("F05 identify CPF 11 dígitos → sessionToken")
    void identifyOk() {
        var r = identify.execute(new IdentifySelfServiceUseCase.Command(
                "12345678901", null, null
        ));
        assertThat(r.verified()).isTrue();
        assertThat(r.sessionToken()).startsWith("ss-");
    }

    @Test
    @DisplayName("F05 3 identify inválidos → 429 lockout")
    void identifyLockout() {
        for (int i = 0; i < 2; i++) {
            assertThatThrownBy(() -> identify.execute(new IdentifySelfServiceUseCase.Command(
                    "123", null, null
            ))).isInstanceOf(DisputeValidationException.class);
        }
        assertThatThrownBy(() -> identify.execute(new IdentifySelfServiceUseCase.Command(
                "123", null, null
        ))).isInstanceOf(DisputeLockoutException.class);
    }

    @Test
    @DisplayName("F05 records sem session → 401")
    void recordsUnauthorized() {
        assertThatThrownBy(() -> listRecords.execute(new ListSelfServiceRecordsUseCase.Query("bad")))
                .isInstanceOf(DisputeUnauthorizedException.class);
    }

    @Test
    @DisplayName("F05 self-service dispute delega F02")
    void openViaSelfService() {
        var session = sessions.create("12345678901", Instant.now().plusSeconds(900));
        when(openDispute.execute(any())).thenReturn(new OpenDisputeUseCase.Result(
                UUID.randomUUID(), "CT-20260728-ABCD", "OPEN", Instant.now().plusSeconds(86400)
        ));

        var r = openSelf.execute(new OpenSelfServiceDisputeUseCase.Command(
                session.token(), "NAO_RECONHECO_DIVIDA",
                "Nunca contratei este serviço e não reconheço.", "neg-01"
        ));

        assertThat(r.protocol()).startsWith("CT-");
        verify(openDispute).execute(any());
    }
}
