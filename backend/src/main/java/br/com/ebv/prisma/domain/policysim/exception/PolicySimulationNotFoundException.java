package br.com.ebv.prisma.domain.policysim.exception;

import java.util.UUID;

public class PolicySimulationNotFoundException extends RuntimeException {
    public PolicySimulationNotFoundException(UUID id) {
        super("Simulação de política não encontrada: " + id);
    }
}
