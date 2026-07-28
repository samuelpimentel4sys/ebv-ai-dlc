package br.com.ebv.prisma.application.altdata;

import br.com.ebv.prisma.domain.altdata.port.in.IngestAltDataUseCase;
import br.com.ebv.prisma.domain.altdata.port.out.AltDataRepositoryPort;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class AltDataServiceTest {

    @Mock AltDataRepositoryPort repo;

    @Test
    @DisplayName("F01 ingest ACCEPTED quando errorRate baixo")
    void ingestAccepted() {
        var svc = new IngestAltDataService(repo);
        var r = svc.execute(new IngestAltDataUseCase.Command(
                "CEMIG-MG", "ENERGIA", "s3://lab/batch", 100, new BigDecimal("0.01")));
        assertThat(r.status()).isEqualTo("ACCEPTED");
        verify(repo).save(any());
    }
}
