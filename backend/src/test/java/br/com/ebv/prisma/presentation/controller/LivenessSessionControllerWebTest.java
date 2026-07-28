package br.com.ebv.prisma.presentation.controller;

import br.com.ebv.prisma.domain.liveness.port.in.CreateLivenessSessionUseCase;
import br.com.ebv.prisma.domain.liveness.port.in.RegisterBiometricConsentUseCase;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * OBS-09 — contrato HTTP âncora Liveness (MockMvc).
 */
@WebMvcTest(controllers = LivenessSessionController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(br.com.ebv.prisma.infrastructure.config.LabMarkFilter.class)
class LivenessSessionControllerWebTest {

    @Autowired MockMvc mvc;

    @MockBean CreateLivenessSessionUseCase createSession;
    @MockBean RegisterBiometricConsentUseCase registerConsent;

    @Test
    void createSession_returns201_shape() throws Exception {
        UUID customer = UUID.fromString("9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d");
        Instant now = Instant.parse("2026-07-28T20:00:00Z");
        when(createSession.execute(any())).thenReturn(new CreateLivenessSessionUseCase.Result(
                "sess-1", customer, "CREATED", now, now.plusSeconds(180), false
        ));

        mvc.perform(post("/api/v1/auth/liveness/session")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"customer_id":"9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
                                 "device_info":{"platform":"iOS"},
                                 "audit_context":{"channel":"MOBILE_APP"}}
                                """))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/v1/auth/liveness/session/sess-1"))
                .andExpect(jsonPath("$.session_id").value("sess-1"))
                .andExpect(jsonPath("$.status").value("CREATED"));
    }

    @Test
    void consent_returnsActive() throws Exception {
        UUID customer = UUID.fromString("9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d");
        when(registerConsent.execute(any())).thenReturn(
                new RegisterBiometricConsentUseCase.Result(customer, "v1.0", "ACTIVE")
        );

        mvc.perform(post("/api/v1/auth/biometric-consent")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"customer_id":"9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d","term_version":"v1.0"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }
}
