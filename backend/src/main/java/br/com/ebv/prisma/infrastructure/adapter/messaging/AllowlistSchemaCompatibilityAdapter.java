package br.com.ebv.prisma.infrastructure.adapter.messaging;

import br.com.ebv.prisma.domain.events.exception.SchemaIncompatibleException;
import br.com.ebv.prisma.domain.events.port.out.SchemaCompatibilityPort;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Gate local até integração Schema Registry Avro (US F01 RN002).
 * Lista branca de versões compatíveis BACKWARD.
 */
@Component
public class AllowlistSchemaCompatibilityAdapter implements SchemaCompatibilityPort {

    private final Set<String> allowedVersions;

    public AllowlistSchemaCompatibilityAdapter(
            @Value("${prisma.events.allowed-schema-versions:CreditEvent:1}") String allowed
    ) {
        this.allowedVersions = Arrays.stream(allowed.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toSet());
    }

    @Override
    public void assertCompatible(String eventType, String schemaVersion) {
        if (schemaVersion == null || !allowedVersions.contains(schemaVersion)) {
            throw new SchemaIncompatibleException(
                    "Schema incompatível eventType=" + eventType + " version=" + schemaVersion
            );
        }
    }
}
