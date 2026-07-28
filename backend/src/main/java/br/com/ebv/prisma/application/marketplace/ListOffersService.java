package br.com.ebv.prisma.application.marketplace;

import br.com.ebv.prisma.domain.marketplace.exception.MarketplaceValidationException;
import br.com.ebv.prisma.domain.marketplace.port.in.ListOffersUseCase;
import br.com.ebv.prisma.domain.marketplace.port.out.MarketplaceRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ListOffersService implements ListOffersUseCase {

    private final MarketplaceRepositoryPort repo;

    public ListOffersService(MarketplaceRepositoryPort repo) { this.repo = repo; }

    @Override
    @Transactional(readOnly = true)
    public Result execute(Query query) {
        if (query.documento() == null || query.documento().isBlank()) {
            throw new MarketplaceValidationException("documento obrigatório");
        }
        // lab: all active offers considered eligible
        var items = repo.findActiveOffers().stream()
                .map(o -> new Item(o.offerId(), o.partnerCode(), o.title(), o.productType(),
                        o.explanationTemplate().replace("{score}", "520")))
                .toList();
        return new Result(items);
    }
}
