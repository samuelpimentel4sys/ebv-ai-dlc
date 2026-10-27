package br.com.ebv.prisma.infrastructure.adapter.worm;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class LocalDisputeEvidenceStoreAdapterTest {

    @TempDir
    Path tempDir;

    LocalDisputeEvidenceStoreAdapter store;

    @BeforeEach
    void setUp() {
        store = new LocalDisputeEvidenceStoreAdapter(tempDir.toString());
    }

    @Test
    void storeThenRead_roundTrip() {
        UUID disputeId = UUID.randomUUID();
        UUID attachmentId = UUID.randomUUID();
        byte[] payload = "evidence".getBytes(StandardCharsets.UTF_8);

        String uri = store.store(disputeId, attachmentId, payload);
        assertThat(store.read(uri)).isEqualTo(payload);
    }

    @Test
    void readOutsideRoot_throwsSecurityException() {
        assertThatThrownBy(() -> store.read("file:///etc/passwd"))
                .isInstanceOf(SecurityException.class)
                .hasMessageContaining("WORM root");
    }
}
