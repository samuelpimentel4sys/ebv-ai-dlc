package br.com.ebv.prisma.domain.events.port.out;

/** F01 RN002 — compatibilidade BACKWARD (Schema Registry). */
public interface SchemaCompatibilityPort {

    /**
     * @throws br.com.ebv.prisma.domain.events.exception.SchemaIncompatibleException se incompatível
     */
    void assertCompatible(String eventType, String schemaVersion);
}
