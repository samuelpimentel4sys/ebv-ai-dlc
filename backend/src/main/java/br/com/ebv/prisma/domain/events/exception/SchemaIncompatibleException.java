package br.com.ebv.prisma.domain.events.exception;

/** F01 RN002 / CT-03. */
public class SchemaIncompatibleException extends RuntimeException {
    public SchemaIncompatibleException(String message) {
        super(message);
    }
}
