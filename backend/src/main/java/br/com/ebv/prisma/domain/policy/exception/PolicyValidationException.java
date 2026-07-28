package br.com.ebv.prisma.domain.policy.exception;

public class PolicyValidationException extends RuntimeException {
    public PolicyValidationException(String message) {
        super(message);
    }
}
