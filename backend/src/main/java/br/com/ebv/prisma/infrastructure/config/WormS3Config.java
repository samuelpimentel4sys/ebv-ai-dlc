package br.com.ebv.prisma.infrastructure.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;

import java.net.URI;

/**
 * WORM S3 client — AWS real ou MinIO lab ({@code prisma.worm.s3.endpoint}).
 */
@Configuration
public class WormS3Config {

    @Bean(name = "wormS3Client")
    @ConditionalOnExpression("'${prisma.worm.backend:fs}'.equals('s3') || '${prisma.audit-worm.backend:fs}'.equals('s3')")
    S3Client wormS3Client(
            @Value("${prisma.worm.s3.region:us-east-1}") String region,
            @Value("${prisma.worm.s3.endpoint:}") String endpoint,
            @Value("${prisma.worm.s3.path-style:true}") boolean pathStyle
    ) {
        var builder = S3Client.builder()
                .region(Region.of(region))
                .credentialsProvider(DefaultCredentialsProvider.create());

        if (endpoint != null && !endpoint.isBlank()) {
            builder.endpointOverride(URI.create(endpoint.trim()))
                    .serviceConfiguration(S3Configuration.builder()
                            .pathStyleAccessEnabled(pathStyle)
                            .build());
        }

        return builder.build();
    }
}
