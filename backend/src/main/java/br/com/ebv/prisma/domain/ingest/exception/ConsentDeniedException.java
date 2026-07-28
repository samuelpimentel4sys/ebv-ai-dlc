package br.com.ebv.prisma.domain.ingest.exception;

/** F06 RN001 / RN004. */
public class ConsentDeniedException extends RuntimeException {
    public ConsentDeniedException(String message) {
        super(message);
    }
}
