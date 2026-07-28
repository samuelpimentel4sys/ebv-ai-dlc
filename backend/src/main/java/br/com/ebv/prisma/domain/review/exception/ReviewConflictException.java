package br.com.ebv.prisma.domain.review.exception;

public class ReviewConflictException extends RuntimeException {
    public ReviewConflictException(String message) {
        super(message);
    }
}
