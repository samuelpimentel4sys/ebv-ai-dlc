package br.com.ebv.prisma.domain.review.exception;

public class ReviewValidationException extends RuntimeException {
    public ReviewValidationException(String message) {
        super(message);
    }
}
