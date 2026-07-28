package br.com.ebv.prisma.domain.subjectrequest.exception;

public class SubjectRequestValidationException extends RuntimeException {
    public SubjectRequestValidationException(String message) {
        super(message);
    }
}
