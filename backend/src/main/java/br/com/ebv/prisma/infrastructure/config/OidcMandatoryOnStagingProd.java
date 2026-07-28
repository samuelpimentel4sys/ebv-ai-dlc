package br.com.ebv.prisma.infrastructure.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * OBS-05 — staging/prod exigem OIDC ligado.
 */
@Component
@Profile({"staging", "prod"})
public class OidcMandatoryOnStagingProd implements ApplicationRunner {

    private final boolean oidcEnabled;

    public OidcMandatoryOnStagingProd(@Value("${prisma.security.enabled:false}") boolean oidcEnabled) {
        this.oidcEnabled = oidcEnabled;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!oidcEnabled) {
            throw new IllegalStateException(
                    "OIDC obrigatório em staging/prod (prisma.security.enabled / OIDC_ENABLED=true). Abortando startup."
            );
        }
    }
}
