package br.com.ebv.prisma.infrastructure.adapter.worm;

import br.com.ebv.prisma.domain.decision.exception.WormWriteException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectResponse;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectResponse;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class S3ObjectLockWormAdapterTest {

    @Mock
    S3Client s3;

    S3ObjectLockWormAdapter adapter;

    @BeforeEach
    void setUp() {
        adapter = new S3ObjectLockWormAdapter(s3, "prisma-worm", "decisions/", 5, false);
    }

    @Test
    void putWritesNewObjectWithComplianceLock() {
        UUID id = UUID.fromString("aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeee01");
        when(s3.headObject(any(HeadObjectRequest.class)))
                .thenThrow(NoSuchKeyException.builder().message("missing").build());
        when(s3.putObject(any(PutObjectRequest.class), any(RequestBody.class)))
                .thenReturn(PutObjectResponse.builder().build());

        String uri = adapter.put(id, "{\"score\":700}");

        assertThat(uri).isEqualTo("s3://prisma-worm/decisions/" + id + ".json");
        ArgumentCaptor<PutObjectRequest> cap = ArgumentCaptor.forClass(PutObjectRequest.class);
        verify(s3).putObject(cap.capture(), any(RequestBody.class));
        assertThat(cap.getValue().objectLockModeAsString()).isEqualTo("COMPLIANCE");
        assertThat(cap.getValue().bucket()).isEqualTo("prisma-worm");
    }

    @Test
    void putRefusesOverwriteWhenKeyExists() {
        UUID id = UUID.randomUUID();
        when(s3.headObject(any(HeadObjectRequest.class))).thenReturn(HeadObjectResponse.builder().build());

        assertThatThrownBy(() -> adapter.put(id, "{}"))
                .isInstanceOf(WormWriteException.class)
                .hasMessageContaining("Object Lock");
    }
}
