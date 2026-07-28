package br.com.ebv.prisma.infrastructure.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Arrays;
import java.util.List;

/**
 * CORS for Sofia Vite FE lab — origins from {@code prisma.cors.allowed-origins}.
 */
@Configuration
public class CorsConfig {

    @Bean
    WebMvcConfigurer corsWebMvcConfigurer(
            @Value("${prisma.cors.allowed-origins:http://localhost:5173,http://localhost:3000}") String origins
    ) {
        List<String> allowed = parseOrigins(origins);
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**")
                        .allowedOrigins(allowed.toArray(String[]::new))
                        .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                        .allowedHeaders("*")
                        .exposedHeaders("X-Correlation-ID")
                        .allowCredentials(true)
                        .maxAge(3600);
            }
        };
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource(
            @Value("${prisma.cors.allowed-origins:http://localhost:5173,http://localhost:3000}") String origins
    ) {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(parseOrigins(origins));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setExposedHeaders(List.of("X-Correlation-ID"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    static List<String> parseOrigins(String raw) {
        return Arrays.stream(raw.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }
}
