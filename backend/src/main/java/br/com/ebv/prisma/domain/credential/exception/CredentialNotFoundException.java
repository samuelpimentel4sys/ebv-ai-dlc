package br.com.ebv.prisma.domain.credential.exception;

public class CredentialNotFoundException extends RuntimeException {
    public CredentialNotFoundException(String message) { super(message); }
}
