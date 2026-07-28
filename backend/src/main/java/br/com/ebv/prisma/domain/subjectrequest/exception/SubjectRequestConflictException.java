package br.com.ebv.prisma.domain.subjectrequest.exception;

public class SubjectRequestConflictException extends RuntimeException {
    public SubjectRequestConflictException(String message) {
        super(message);
    }
}
