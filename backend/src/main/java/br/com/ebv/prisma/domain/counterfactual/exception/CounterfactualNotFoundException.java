package br.com.ebv.prisma.domain.counterfactual.exception;

import java.util.UUID;

public class CounterfactualNotFoundException extends RuntimeException {

    public CounterfactualNotFoundException(UUID decisionId) {
        super("Contrafactual não encontrado para decisão: " + decisionId);
    }
}
