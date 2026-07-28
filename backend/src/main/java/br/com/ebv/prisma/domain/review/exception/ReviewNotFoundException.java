package br.com.ebv.prisma.domain.review.exception;

import java.util.UUID;

public class ReviewNotFoundException extends RuntimeException {
    public ReviewNotFoundException(UUID reviewId) {
        super("Revisão não encontrada: " + reviewId);
    }
}
