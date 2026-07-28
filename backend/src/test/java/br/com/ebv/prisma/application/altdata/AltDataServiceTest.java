package br.com.ebv.prisma.application.altdata;

import br.com.ebv.prisma.domain.altdata.port.in.IngestAltDataUseCase;
import br.com.ebv.prisma.domain.altdata.port.out.AltDataRepositoryPort;
import br.com.ebv.prisma.domain.consent.port.out.ConsentRepositoryPort;
import br.com.ebv.prisma.domain.ingest.exception.ConsentDeniedException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AltDataServiceTest {

    @Mock AltDataRepositoryPort repo;
    @Mock ConsentRepositoryPort consents;

    @Test
    @DisplayName("F01 ingest ACCEPTED com consent ACTIVE")
    void ingestAccepted() {
        when(consents.findByDocumentoHash(anyString())).thenReturn(List.of(
                new ConsentRepositoryPort.ConsentRecord(
                        UUID.randomUUID(), "hash", "ALTERNATIVE_DATA", "CEMIG",
                        "ACTIVE", Instant.now(), null, null, "API", "v1"
                )
        ));
        var svc = new IngestAltDataService(repo, consents);
        var r = svc.execute(new IngestAltDataUseCase.Command(
                "12345678901", "CEMIG-MG", "ENERGIA", "s3://lab/batch", 100, new BigDecimal("0.01")));
        assertThat(r.status()).isEqualTo("ACCEPTED");
        verify(repo).save(any());
    }

    @Test
    @DisplayName("OBS-19 fail-closed sem consent")
    void ingestDeniedWithoutConsent() {
        when(consents.findByDocumentoHash(anyString())).thenReturn(List.of());
        var svc = new IngestAltDataService(repo, consents);
        assertThatThrownBy(() -> svc.execute(new IngestAltDataUseCase.Command(
                "12345678901", "CEMIG-MG", "ENERGIA", "s3://lab/batch", 100, new BigDecimal("0.01"))))
                .isInstanceOf(ConsentDeniedException.class);
    }
}
