package br.com.ebv.prisma.infrastructure.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    @Profile("!infra")
    SecurityFilterChain openLocal(HttpSecurity http) throws Exception {
        return permitAll(http);
    }

    @Bean
    @Profile("infra")
    SecurityFilterChain infraSecurity(
            HttpSecurity http,
            @Value("${prisma.security.enabled:false}") boolean oidcEnabled
    ) throws Exception {
        if (!oidcEnabled) {
            return permitAll(http);
        }
        http.csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(
                                "/actuator/health",
                                "/actuator/health/**",
                                "/actuator/info",
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/api-docs/**",
                                "/v3/api-docs/**"
                        ).permitAll()
                        .requestMatchers("/api/v1/identity/**").hasAnyRole("DATA_STEWARD", "PLATFORM")
                        .requestMatchers("/api/v1/events/**").hasAnyRole("EVENT_PRODUCER", "PLATFORM")
                        .requestMatchers("/api/v1/streams/**").hasAnyRole("SRE", "PLATFORM")
                        .requestMatchers("/api/v1/ingest/**").hasAnyRole("DATA_ENG", "PLATFORM", "EVENT_PRODUCER")
                        .requestMatchers("/api/v1/features/**").hasAnyRole("ML", "ANALISTA_RISCO", "PLATFORM")
                        .requestMatchers("/api/v1/models/**").hasAnyRole("ML_OPS", "RISCO", "PLATFORM")
                        .requestMatchers("/api/v1/score/**").hasAnyRole("ANALISTA", "PLATFORM")
                        .requestMatchers("/api/v1/decisions/**").hasAnyRole("COMPLIANCE", "B2B", "PLATFORM")
                        .requestMatchers("/api/v1/observability/**").hasAnyRole("SRE", "B2B", "PLATFORM")
                        .requestMatchers("/api/v1/replay/**").hasAnyRole("DATA_ENG", "PLATFORM")
                        .requestMatchers("/api/v1/policy/**").hasAnyRole("POLICY_ANALYST", "PLATFORM")
                        .requestMatchers("/api/v1/reasons/**").hasAnyRole("LEGAL_EDITOR", "PLATFORM")
                        .requestMatchers("/api/v1/audit/**").hasAnyRole("COMPLIANCE_AUDITOR", "PLATFORM")
                        .requestMatchers("/api/v1/explain/**").hasAnyRole("ANALISTA", "DPO", "COMPLIANCE", "PLATFORM")
                        .requestMatchers("/api/v1/counterfactual/**").hasAnyRole("ANALISTA", "DPO", "COMPLIANCE", "PLATFORM")
                        .requestMatchers("/api/v1/dossier/**").hasAnyRole("DPO", "COMPLIANCE", "PLATFORM")
                        .anyRequest().authenticated()
                )
                .oauth2ResourceServer(oauth -> oauth.jwt(jwt -> jwt.jwtAuthenticationConverter(keycloakRolesConverter())));
        return http.build();
    }

    private static SecurityFilterChain permitAll(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .anyRequest().permitAll());
        return http.build();
    }

    private static Converter<Jwt, ? extends AbstractAuthenticationToken> keycloakRolesConverter() {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(jwt -> {
            Map<String, Object> realmAccess = jwt.getClaim("realm_access");
            if (realmAccess == null || !(realmAccess.get("roles") instanceof Collection<?> roles)) {
                return List.of();
            }
            return roles.stream()
                    .map(Object::toString)
                    .map(role -> role.startsWith("ROLE_") ? role : "ROLE_" + role.replace("ROLE_", ""))
                    .map(SimpleGrantedAuthority::new)
                    .collect(Collectors.toList());
        });
        return converter;
    }
}
