package br.com.ebv.prisma.domain.portfolio.exception;

public class PortfolioNotFoundException extends RuntimeException {
    public PortfolioNotFoundException(String message) { super(message); }
}
