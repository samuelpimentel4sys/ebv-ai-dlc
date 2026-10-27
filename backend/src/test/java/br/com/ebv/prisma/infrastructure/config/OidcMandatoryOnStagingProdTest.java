package br.com.ebv.prisma.infrastructure.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.core.env.StandardEnvironment;
import org.springframework.mock.env.MockEnvironment;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class OidcMandatoryOnStagingProdTest {

    @Test
    @DisplayName("lab supabase+infra + OIDC off → sobe")
    void labInfraOidcOffOk() {
        var env = new MockEnvironment();
        env.setActiveProfiles("supabase", "infra");
        var gate = new OidcMandatoryOnStagingProd(false, env);
        assertThatCode(() -> gate.run(null)).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("staging + OIDC off → aborta")
    void stagingAborts() {
        var env = new MockEnvironment();
        env.setActiveProfiles("staging");
        var gate = new OidcMandatoryOnStagingProd(false, env);
        assertThatThrownBy(() -> gate.run(null)).isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("OIDC on nunca aborta")
    void oidcOnAlwaysOk() {
        var env = new StandardEnvironment();
        env.setActiveProfiles("prod");
        var gate = new OidcMandatoryOnStagingProd(true, env);
        assertThatCode(() -> gate.run(null)).doesNotThrowAnyException();
    }
}
