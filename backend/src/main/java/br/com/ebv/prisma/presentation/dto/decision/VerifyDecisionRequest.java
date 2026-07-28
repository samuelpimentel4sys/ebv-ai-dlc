package br.com.ebv.prisma.presentation.dto.decision;

public record VerifyDecisionRequest(
        Boolean checkChain
) {
    public boolean checkChainOrDefault() {
        return checkChain == null || checkChain;
    }
}
