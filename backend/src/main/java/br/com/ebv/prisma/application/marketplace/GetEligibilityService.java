package br.com.ebv.prisma.application.marketplace;

import br.com.ebv.prisma.domain.marketplace.exception.MarketplaceValidationException;
import br.com.ebv.prisma.domain.marketplace.port.in.GetEligibilityUseCase;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class GetEligibilityService implements GetEligibilityUseCase {

    @Override
    public Result execute(Query query) {
        if (query.documento() == null || query.documento().isBlank()) {
            throw new MarketplaceValidationException("documento obrigatório");
        }
        return new Result(true, List.of(
                new Criterion("MIN_SCORE", true, "score thin-file >= 400"),
                new Criterion("CONSENT_MARKETPLACE", true, "consent lab stub")
        ));
    }
}
