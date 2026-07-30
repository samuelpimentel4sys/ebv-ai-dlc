package br.com.ebv.prisma.infrastructure.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;

import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Set;

/**
 * Se {@code PRISMA_SHOWCASE=true}, ativa profile {@code showcase} e remove {@code infra}.
 * Defaults de stub ficam em {@code application-showcase.yml}.
 */
public class ShowcaseEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        boolean flag = bool(environment.getProperty("PRISMA_SHOWCASE"))
                || bool(environment.getProperty("prisma.showcase.enabled"));
        if (!flag) {
            return;
        }

        Set<String> profiles = new LinkedHashSet<>(Arrays.asList(environment.getActiveProfiles()));
        boolean removedInfra = profiles.remove("infra");
        profiles.add("showcase");
        environment.setActiveProfiles(profiles.toArray(String[]::new));

        if (removedInfra) {
            System.out.println("[SHOWCASE] profile 'infra' removido — Redis/Kafka desligados");
        }
        System.out.println("[SHOWCASE] ativo — profiles=" + Arrays.toString(environment.getActiveProfiles()));
    }

    private static boolean bool(String v) {
        if (v == null || v.isBlank()) {
            return false;
        }
        String s = v.trim().toLowerCase(Locale.ROOT);
        return s.equals("true") || s.equals("1") || s.equals("yes") || s.equals("on");
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE + 50;
    }
}
