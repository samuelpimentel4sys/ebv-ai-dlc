package br.com.ebv.prisma.presentation.security;

import br.com.ebv.prisma.domain.identity.model.DocumentoCanonico;
import br.com.ebv.prisma.domain.identity.model.GoldenRecord;
import br.com.ebv.prisma.domain.identity.port.in.GetIdentityUseCase;
import br.com.ebv.prisma.domain.identity.port.in.ListCandidatesUseCase;
import br.com.ebv.prisma.domain.identity.port.in.MergeIdentityUseCase;
import br.com.ebv.prisma.domain.identity.port.in.UndoMergeUseCase;
import br.com.ebv.prisma.infrastructure.config.SecurityConfig;
import br.com.ebv.prisma.presentation.controller.IdentityController;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Sprint 6 — OIDC CTs sem Keycloak real.
 * Filter chain: 401 sem token, 403 role errada, 200 role certa.
 * Conversão realm_access → ver {@link br.com.ebv.prisma.infrastructure.config.KeycloakRealmRoleConverterTest}.
 */
@WebMvcTest(controllers = IdentityController.class)
@Import(SecurityConfig.class)
@ActiveProfiles("infra")
@TestPropertySource(properties = {
        "prisma.security.enabled=true",
        "spring.security.oauth2.resourceserver.jwt.jwk-set-uri=https://example.invalid/jwks"
})
class OidcSecurityWebMvcTest {

    @Autowired
    MockMvc mockMvc;

    @MockBean
    JwtDecoder jwtDecoder;

    @MockBean
    GetIdentityUseCase getIdentityUseCase;

    @MockBean
    MergeIdentityUseCase mergeIdentityUseCase;

    @MockBean
    UndoMergeUseCase undoMergeUseCase;

    @MockBean
    ListCandidatesUseCase listCandidatesUseCase;

    @BeforeEach
    void stubIdentity() {
        when(getIdentityUseCase.execute(anyString()))
                .thenReturn(GoldenRecord.create(new DocumentoCanonico("12345678901")));
    }

    @Test
    void identityWithoutToken_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/identity/12345678901"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void identityWithWrongRole_returns403() throws Exception {
        mockMvc.perform(get("/api/v1/identity/12345678901")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ML"))))
                .andExpect(status().isForbidden());
    }

    @Test
    void identityWithDataSteward_returns200() throws Exception {
        mockMvc.perform(get("/api/v1/identity/12345678901")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_DATA_STEWARD"))))
                .andExpect(status().isOk());
    }

    @Test
    void identityWithPlatform_returns200() throws Exception {
        mockMvc.perform(get("/api/v1/identity/12345678901")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_PLATFORM"))))
                .andExpect(status().isOk());
    }
}
