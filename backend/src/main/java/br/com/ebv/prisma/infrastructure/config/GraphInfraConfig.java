package br.com.ebv.prisma.infrastructure.config;

import org.neo4j.driver.AuthTokens;
import org.neo4j.driver.Driver;
import org.neo4j.driver.GraphDatabase;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GraphInfraConfig {

    @Bean(destroyMethod = "close")
    @ConditionalOnProperty(name = "prisma.graph.backend", havingValue = "neo4j")
    Driver neo4jDriver(
            @Value("${prisma.graph.neo4j.uri}") String uri,
            @Value("${prisma.graph.neo4j.user}") String user,
            @Value("${prisma.graph.neo4j.password}") String password
    ) {
        return GraphDatabase.driver(uri, AuthTokens.basic(user, password));
    }
}
