package br.com.ebv.prisma;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Sprint 6 hardening — Flyway sobe no Postgres 16 real (Docker).
 * Sem Docker: teste desabilitado automaticamente.
 */
@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class FlywayPostgresIT {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("prisma")
            .withUsername("prisma")
            .withPassword("prisma");

    @DynamicPropertySource
    static void datasource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.flyway.enabled", () -> "true");
        registry.add("prisma.security.enabled", () -> "false");
        registry.add("prisma.worm.fail", () -> "false");
        registry.add("spring.kafka.listener.auto-startup", () -> "false");
        registry.add("spring.autoconfigure.exclude",
                () -> "org.springframework.boot.autoconfigure.kafka.KafkaAutoConfiguration");
    }

    @Autowired
    JdbcTemplate jdbc;

    @Test
    void flywayAppliedThroughLatestMigration() {
        Integer count = jdbc.queryForObject(
                "select count(*) from flyway_schema_history where success = true",
                Integer.class
        );
        assertThat(count).isNotNull().isGreaterThanOrEqualTo(40);
    }
}
