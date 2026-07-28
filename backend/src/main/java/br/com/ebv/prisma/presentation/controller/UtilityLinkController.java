package br.com.ebv.prisma.presentation.controller;

import br.com.ebv.prisma.domain.utilitylink.port.in.LinkUtilityUseCase;
import br.com.ebv.prisma.domain.utilitylink.port.in.ListUtilityLinksUseCase;
import br.com.ebv.prisma.domain.utilitylink.port.in.UnlinkUtilityUseCase;
import br.com.ebv.prisma.presentation.dto.utilitylink.LinkUtilityRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
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
@RequestMapping("/api/v1/utilities")
@Tag(name = "Utilities", description = "PRISMA-EP-06-F08 Validação de titularidade")
public class UtilityLinkController {

    private final LinkUtilityUseCase link;
    private final ListUtilityLinksUseCase list;
    private final UnlinkUtilityUseCase unlink;

    public UtilityLinkController(LinkUtilityUseCase link, ListUtilityLinksUseCase list, UnlinkUtilityUseCase unlink) {
        this.link = link;
        this.list = list;
        this.unlink = unlink;
    }

    @PostMapping("/link")
    @Operation(summary = "Solicita vínculo e valida titularidade")
    public ResponseEntity<Map<String, Object>> link(@Valid @RequestBody LinkUtilityRequest req) {
        var r = link.execute(new LinkUtilityUseCase.Command(
                req.documento(), req.partnerCode(), req.accountRef(), req.utilityType(), req.holderName()));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("linkId", r.linkId().toString());
        body.put("status", r.status());
        body.put("sourceConfirmed", r.sourceConfirmed());
        body.put("nameMatchScore", r.nameMatchScore());
        return ResponseEntity.status(HttpStatus.CREATED).body(body);
    }

    @GetMapping("/links")
    @Operation(summary = "Lista vínculos do titular")
    public Map<String, Object> links(@RequestParam String documento) {
        var r = list.execute(new ListUtilityLinksUseCase.Query(documento));
        List<Map<String, Object>> links = r.links().stream().map(l -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("linkId", l.linkId().toString());
            m.put("partnerCode", l.partnerCode());
            m.put("accountRef", l.accountRef());
            m.put("utilityType", l.utilityType());
            m.put("status", l.status());
            return m;
        }).toList();
        return Map.of("links", links);
    }

    @DeleteMapping("/links/{linkId}")
    @Operation(summary = "Desvincula conta")
    public Map<String, Object> unlink(@PathVariable UUID linkId) {
        var r = unlink.execute(new UnlinkUtilityUseCase.Command(linkId));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("linkId", r.linkId().toString());
        body.put("status", r.status());
        return body;
    }
}
