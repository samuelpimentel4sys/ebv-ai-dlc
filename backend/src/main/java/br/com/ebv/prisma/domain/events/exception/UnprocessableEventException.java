package br.com.ebv.prisma.domain.events.exception;

/** F01 RN001 / CT-02. */
public class UnprocessableEventException extends RuntimeException {
    public UnprocessableEventException(String message) {
        super(message);
    }
}
