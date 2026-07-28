package br.com.ebv.prisma.presentation.controller;

import br.com.ebv.prisma.domain.marketplace.port.in.ApplyOfferUseCase;
import br.com.ebv.prisma.domain.marketplace.port.in.GetEligibilityUseCase;
import br.com.ebv.prisma.domain.marketplace.port.in.ListOffersUseCase;
import br.com.ebv.prisma.presentation.dto.marketplace.ApplyOfferRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/marketplace")
@Tag(name = "Marketplace", description = "PRISMA-EP-06-F07 Elegibilidade e encaminhamento")
public class MarketplaceController {

    private final ListOffersUseCase listOffers;
    private final ApplyOfferUseCase apply;
    private final GetEligibilityUseCase eligibility;

    public MarketplaceController(ListOffersUseCase listOffers, ApplyOfferUseCase apply, GetEligibilityUseCase eligibility) {
        this.listOffers = listOffers;
        this.apply = apply;
        this.eligibility = eligibility;
    }

    @GetMapping("/offers")
    @Operation(summary = "Vitrine filtrada por elegibilidade")
    public Map<String, Object> offers(@RequestParam String documento) {
        var r = listOffers.execute(new ListOffersUseCase.Query(documento));
        List<Map<String, Object>> offers = r.offers().stream().map(o -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("offerId", o.offerId().toString());
            m.put("partnerCode", o.partnerCode());
            m.put("title", o.title());
            m.put("productType", o.productType());
            m.put("explanation", o.explanation());
            return m;
        }).toList();
        return Map.of("offers", offers);
    }

    @PostMapping("/offers/{id}/apply")
    @Operation(summary = "Encaminha lead com consentimento")
    public ResponseEntity<Map<String, Object>> apply(@PathVariable("id") UUID id, @Valid @RequestBody ApplyOfferRequest req) {
        var r = apply.execute(new ApplyOfferUseCase.Command(id, req.documento(), req.consentId()));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("referralId", r.referralId().toString());
        body.put("status", r.status());
        body.put("partnerRef", r.partnerRef());
        return ResponseEntity.status(HttpStatus.CREATED).body(body);
    }

    @GetMapping("/eligibility")
    @Operation(summary = "Critérios e elegibilidade do titular")
    public Map<String, Object> eligibility(@RequestParam String documento) {
        var r = eligibility.execute(new GetEligibilityUseCase.Query(documento));
        List<Map<String, Object>> criteria = r.criteria().stream().map(c -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("code", c.code());
            m.put("met", c.met());
            m.put("detail", c.detail());
            return m;
        }).toList();
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("eligible", r.eligible());
        body.put("criteria", criteria);
        return body;
    }
}
