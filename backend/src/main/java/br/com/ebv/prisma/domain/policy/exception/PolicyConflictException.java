package br.com.ebv.prisma.domain.policy.exception;

public class PolicyConflictException extends RuntimeException {
    public PolicyConflictException(String message) {
        super(message);
    }
}
