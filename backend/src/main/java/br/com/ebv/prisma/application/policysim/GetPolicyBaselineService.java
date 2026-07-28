package br.com.ebv.prisma.application.policysim;

import br.com.ebv.prisma.domain.policy.port.out.PolicyVersionRepositoryPort;
import br.com.ebv.prisma.domain.policysim.port.in.GetPolicyBaselineUseCase;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
public class GetPolicyBaselineService implements GetPolicyBaselineUseCase {

    public static final String STUB_VERSION = "POL-LAB-BASELINE";

    private final PolicyVersionRepositoryPort policyVersionRepo;

    public GetPolicyBaselineService(PolicyVersionRepositoryPort policyVersionRepo) {
        this.policyVersionRepo = policyVersionRepo;
    }

    @Override
    @Transactional(readOnly = true)
    public Result execute(Query query) {
        String portfolio = query.portfolio() == null || query.portfolio().isBlank()
                ? "DEFAULT" : query.portfolio().trim();
        LocalDate asOf = query.asOfDate() != null ? query.asOfDate() : LocalDate.now();

        var published = policyVersionRepo.search("PUBLISHED", null, null, null, 0, 1).items();
        if (!published.isEmpty()) {
            var p = published.getFirst();
            return new Result(p.version(), p.status(), portfolio, asOf, p.artifactHash(), false);
        }
        return new Result(STUB_VERSION, "PUBLISHED", portfolio, asOf, "sha256:lab-stub-baseline", true);
    }
}
