package br.com.ebv.prisma.domain.decision.exception;

public class ChainBrokenException extends RuntimeException {
    public ChainBrokenException(String message) {
        super(message);
    }
}
