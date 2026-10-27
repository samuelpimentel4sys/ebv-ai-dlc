package br.com.ebv.prisma.infrastructure.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtDecoders;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;

/**
 * O browser emite o token com issuer {@code localhost}. O processo no Docker
 * busca o JWKS pelo hostname interno do Keycloak, sem sair para o host.
 */
@Configuration
@ConditionalOnProperty(name = "prisma.security.enabled", havingValue = "true")
public class OidcJwtDecoderConfig {

    @Bean
    JwtDecoder oidcJwtDecoder(
            @Value("${spring.security.oauth2.resourceserver.jwt.jwk-set-uri:}") String jwkSetUri,
            @Value("${spring.security.oauth2.resourceserver.jwt.issuer-uri:}") String issuerUri
    ) {
        if (jwkSetUri == null || jwkSetUri.isBlank()) {
            return JwtDecoders.fromIssuerLocation(issuerUri);
        }
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withJwkSetUri(jwkSetUri).build();
        if (issuerUri != null && !issuerUri.isBlank()) {
            decoder.setJwtValidator(JwtValidators.createDefaultWithIssuer(issuerUri));
        }
        return decoder;
    }
}
