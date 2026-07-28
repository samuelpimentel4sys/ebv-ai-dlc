package br.com.ebv.prisma.infrastructure.adapter.worm;

import br.com.ebv.prisma.domain.decision.exception.WormWriteException;
import br.com.ebv.prisma.domain.decision.port.out.WormStoragePort;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.ObjectLockLegalHoldStatus;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;

/**
 * S3 Object Lock WORM — put only if key absent; optional COMPLIANCE retention.
 * Active when {@code prisma.worm.backend=s3}.
 */
@Component
@ConditionalOnProperty(name = "prisma.worm.backend", havingValue = "s3")
public class S3ObjectLockWormAdapter implements WormStoragePort {

    private final S3Client s3;
    private final String bucket;
    private final String prefix;
    private final int retentionYears;
    private final boolean fail;

    public S3ObjectLockWormAdapter(
            @Qualifier("wormS3Client") S3Client s3,
            @Value("${prisma.worm.s3.bucket}") String bucket,
            @Value("${prisma.worm.s3.prefix:decisions/}") String prefix,
            @Value("${prisma.worm.s3.retention-years:5}") int retentionYears,
            @Value("${prisma.worm.fail:false}") boolean fail
    ) {
        this.s3 = s3;
        this.bucket = bucket;
        this.prefix = prefix.endsWith("/") ? prefix : prefix + "/";
        this.retentionYears = retentionYears;
        this.fail = fail;
    }

    @Override
    public String put(UUID decisionId, String canonicalJson) {
        if (fail) {
            throw new WormWriteException("WORM forçado a falhar (prisma.worm.fail=true)");
        }
        String key = prefix + decisionId + ".json";
        if (exists(key)) {
            throw new WormWriteException("Object Lock: recusa overwrite s3://" + bucket + "/" + key);
        }
        try {
            var put = PutObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .contentType("application/json")
                    .objectLockMode("COMPLIANCE")
                    .objectLockRetainUntilDate(
                            LocalDate.now(ZoneOffset.UTC).plusYears(retentionYears)
                                    .atStartOfDay().toInstant(ZoneOffset.UTC)
                    )
                    .objectLockLegalHoldStatus(ObjectLockLegalHoldStatus.OFF)
                    .build();
            s3.putObject(put, RequestBody.fromString(canonicalJson, StandardCharsets.UTF_8));
            return "s3://" + bucket + "/" + key;
        } catch (WormWriteException e) {
            throw e;
        } catch (S3Exception e) {
            throw new WormWriteException("Falha S3 WORM: " + e.awsErrorDetails().errorMessage(), e);
        } catch (RuntimeException e) {
            throw new WormWriteException("Falha S3 WORM: " + e.getMessage(), e);
        }
    }

    @Override
    public Optional<String> get(UUID decisionId) {
        String key = prefix + decisionId + ".json";
        try {
            var bytes = s3.getObjectAsBytes(GetObjectRequest.builder().bucket(bucket).key(key).build());
            return Optional.of(bytes.asString(StandardCharsets.UTF_8));
        } catch (NoSuchKeyException e) {
            return Optional.empty();
        } catch (S3Exception e) {
            if (e.statusCode() == 404) {
                return Optional.empty();
            }
            return Optional.empty();
        }
    }

    private boolean exists(String key) {
        try {
            s3.headObject(HeadObjectRequest.builder().bucket(bucket).key(key).build());
            return true;
        } catch (NoSuchKeyException e) {
            return false;
        } catch (S3Exception e) {
            if (e.statusCode() == 404) {
                return false;
            }
            throw new WormWriteException("Falha HeadObject S3: " + e.awsErrorDetails().errorMessage(), e);
        }
    }
}
