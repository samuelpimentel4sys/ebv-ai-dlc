package br.com.ebv.prisma.infrastructure.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;

@Configuration
public class WormS3Config {

    @Bean(name = "wormS3Client")
    @ConditionalOnExpression("'${prisma.worm.backend:fs}'.equals('s3') || '${prisma.audit-worm.backend:fs}'.equals('s3')")
    S3Client wormS3Client(@Value("${prisma.worm.s3.region:us-east-1}") String region) {
        return S3Client.builder()
                .region(Region.of(region))
                .credentialsProvider(DefaultCredentialsProvider.create())
                .build();
    }
}
