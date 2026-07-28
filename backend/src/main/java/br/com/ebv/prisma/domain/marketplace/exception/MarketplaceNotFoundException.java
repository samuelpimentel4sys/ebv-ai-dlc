package br.com.ebv.prisma.domain.marketplace.exception;

public class MarketplaceNotFoundException extends RuntimeException {
    public MarketplaceNotFoundException(String message) { super(message); }
}
