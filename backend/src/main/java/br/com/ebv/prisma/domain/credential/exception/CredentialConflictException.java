package br.com.ebv.prisma.domain.credential.exception;

public class CredentialConflictException extends RuntimeException {
    public CredentialConflictException(String message) { super(message); }
}
