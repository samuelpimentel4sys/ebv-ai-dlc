package br.com.ebv.prisma.infrastructure.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.stereotype.Component;

/**
 * OBS-05 / FIX-01 — OIDC obrigatório em staging/prod.
 * Lab (local | showcase | supabase | infra no host 47): OIDC_ENABLED=false permitido.
 */
@Component
public class OidcMandatoryOnStagingProd implements ApplicationRunner {

    private final boolean oidcEnabled;
    private final Environment environment;

    public OidcMandatoryOnStagingProd(
            @Value("${prisma.security.enabled:true}") boolean oidcEnabled,
            Environment environment
    ) {
        this.oidcEnabled = oidcEnabled;
        this.environment = environment;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (oidcEnabled) {
            return;
        }
        boolean stagingOrProd = environment.acceptsProfiles(Profiles.of("staging", "prod"));
        if (stagingOrProd) {
            throw new IllegalStateException(
                    "OIDC obrigatório em staging/prod (prisma.security.enabled / OIDC_ENABLED=true). "
                            + "Lab: supabase e/ou infra + OIDC_ENABLED=false. Abortando startup."
            );
        }
    }
}
