package br.com.ebv.prisma.application.policysim;

import br.com.ebv.prisma.domain.policysim.exception.PolicySimulationNotFoundException;
import br.com.ebv.prisma.domain.policysim.port.in.GetPolicySimulationUseCase;
import br.com.ebv.prisma.domain.policysim.port.out.PolicySimulationRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class GetPolicySimulationService implements GetPolicySimulationUseCase {

    private final PolicySimulationRepositoryPort simulationRepo;

    public GetPolicySimulationService(PolicySimulationRepositoryPort simulationRepo) {
        this.simulationRepo = simulationRepo;
    }

    @Override
    @Transactional(readOnly = true)
    public Result execute(UUID id) {
        var r = simulationRepo.findById(id)
                .orElseThrow(() -> new PolicySimulationNotFoundException(id));
        return new Result(
                r.id(), r.status(), r.candidatePolicyJson(), r.sampleRef(),
                r.baselineVersion(), r.metricsJson(), r.resultJson(),
                r.createdAt(), r.finishedAt()
        );
    }
}
