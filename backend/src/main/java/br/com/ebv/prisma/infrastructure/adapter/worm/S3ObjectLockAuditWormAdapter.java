package br.com.ebv.prisma.infrastructure.adapter.worm;

import br.com.ebv.prisma.domain.audit.exception.AuditWormWriteException;
import br.com.ebv.prisma.domain.audit.port.out.AuditWormStoragePort;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.ObjectLockLegalHoldStatus;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.UUID;

@Component
@ConditionalOnProperty(name = "prisma.audit-worm.backend", havingValue = "s3")
public class S3ObjectLockAuditWormAdapter implements AuditWormStoragePort {

    private final S3Client s3;
    private final String bucket;
    private final String prefix;
    private final int retentionYears;
    private final boolean fail;

    public S3ObjectLockAuditWormAdapter(
            @Qualifier("wormS3Client") S3Client s3,
            @Value("${prisma.audit-worm.s3.bucket:${prisma.worm.s3.bucket}}") String bucket,
            @Value("${prisma.audit-worm.s3.prefix:audit/}") String prefix,
            @Value("${prisma.audit-worm.s3.retention-years:5}") int retentionYears,
            @Value("${prisma.audit-worm.fail:false}") boolean fail
    ) {
        this.s3 = s3;
        this.bucket = bucket;
        this.prefix = prefix.endsWith("/") ? prefix : prefix + "/";
        this.retentionYears = retentionYears;
        this.fail = fail;
    }

    @Override
    public String put(UUID eventId, String canonicalJson) {
        if (fail) {
            throw new AuditWormWriteException("Audit WORM forçado a falhar (prisma.audit-worm.fail=true)");
        }
        String key = prefix + eventId + ".json";
        if (exists(key)) {
            throw new AuditWormWriteException("Object Lock: recusa overwrite s3://" + bucket + "/" + key);
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
        } catch (AuditWormWriteException e) {
            throw e;
        } catch (S3Exception e) {
            throw new AuditWormWriteException("Falha S3 audit WORM: " + e.awsErrorDetails().errorMessage(), e);
        } catch (RuntimeException e) {
            throw new AuditWormWriteException("Falha S3 audit WORM: " + e.getMessage(), e);
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
            throw new AuditWormWriteException("Falha HeadObject S3 audit: " + e.awsErrorDetails().errorMessage(), e);
        }
    }
}
