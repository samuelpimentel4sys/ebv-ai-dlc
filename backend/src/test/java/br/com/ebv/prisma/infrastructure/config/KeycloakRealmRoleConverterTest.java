package br.com.ebv.prisma.infrastructure.config;

import org.junit.jupiter.api.Test;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class KeycloakRealmRoleConverterTest {

    private final KeycloakRealmRoleConverter converter = new KeycloakRealmRoleConverter();

    @Test
    void mapsRealmRolesToSpringAuthorities() {
        Jwt jwt = jwtWithRoles(List.of("DATA_STEWARD", "PLATFORM"));
        Collection<GrantedAuthority> authorities = converter.convert(jwt);
        assertThat(authorities)
                .extracting(GrantedAuthority::getAuthority)
                .containsExactlyInAnyOrder("ROLE_DATA_STEWARD", "ROLE_PLATFORM");
    }

    @Test
    void emptyWhenNoRealmAccess() {
        Jwt jwt = Jwt.withTokenValue("t")
                .header("alg", "none")
                .claim("sub", "u1")
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(60))
                .build();
        assertThat(converter.convert(jwt)).isEmpty();
    }

    private static Jwt jwtWithRoles(List<String> roles) {
        return Jwt.withTokenValue("t")
                .header("alg", "none")
                .claim("sub", "u1")
                .claim("realm_access", Map.of("roles", roles))
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(60))
                .build();
    }
}
