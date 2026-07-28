package br.com.ebv.prisma.application.features;

import br.com.ebv.prisma.domain.features.port.out.FeatureStorePort;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GetFeaturesServiceTest {

    @Mock
    FeatureStorePort featureStore;

    @Test
    @DisplayName("CT-02 liveRead — asOf null deve definir liveRead=true e asOf=now")
    void liveReadAsOfNull() {
        when(featureStore.countActiveGoldenRecords("12345678901")).thenReturn(1L);
        when(featureStore.listActiveCatalog()).thenReturn(List.of());

        var service = new GetFeaturesService(featureStore, new ObjectMapper());
        var result = service.execute("12345678901", null, List.of());

        assertThat(result.liveRead()).isTrue();
        assertThat(result.documento()).isEqualTo("12345678901");
        assertThat(result.asOf()).isNotNull();
        assertThat(result.features()).isEmpty();
    }

    @Test
    @DisplayName("CT-02b liveRead — feature presente retorna valor correto")
    void liveReadWithFeature() {
        var catalog = new FeatureStorePort.CatalogEntry("divida_aberta", "Titular", "NUMERIC", 86400, "DLC", true);
        var value = new FeatureStorePort.FeatureValue("divida_aberta", null, "5000.00", java.time.Instant.now().minusSeconds(10));

        when(featureStore.countActiveGoldenRecords("12345678901")).thenReturn(1L);
        when(featureStore.findCatalog("divida_aberta")).thenReturn(Optional.of(catalog));
        when(featureStore.findAsOf(eq("12345678901"), eq("divida_aberta"), any())).thenReturn(Optional.of(value));

        var service = new GetFeaturesService(featureStore, new ObjectMapper());
        var result = service.execute("12345678901", null, List.of("divida_aberta"));

        assertThat(result.liveRead()).isTrue();
        assertThat(result.features()).containsKey("divida_aberta");
        assertThat(result.features().get("divida_aberta").degraded()).isFalse();
    }
}
