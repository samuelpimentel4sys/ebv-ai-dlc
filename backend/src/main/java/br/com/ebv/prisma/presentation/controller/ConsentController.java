package br.com.ebv.prisma.presentation.controller;

import br.com.ebv.prisma.domain.consent.port.in.ListConsentsUseCase;
import br.com.ebv.prisma.domain.consent.port.in.RegisterConsentUseCase;
import br.com.ebv.prisma.domain.consent.port.in.RevokeConsentUseCase;
import br.com.ebv.prisma.presentation.dto.consent.RegisterConsentRequest;
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
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/consents")
@Tag(name = "Consent", description = "PRISMA-EP-06-F04 Ciclo de vida do consentimento")
public class ConsentController {

    private final RegisterConsentUseCase register;
    private final ListConsentsUseCase list;
    private final RevokeConsentUseCase revoke;

    public ConsentController(RegisterConsentUseCase register, ListConsentsUseCase list, RevokeConsentUseCase revoke) {
        this.register = register;
        this.list = list;
        this.revoke = revoke;
    }

    @PostMapping
    @Operation(summary = "Registra consentimento granular")
    public ResponseEntity<Map<String, Object>> register(@Valid @RequestBody RegisterConsentRequest req) {
        var items = req.items().stream()
                .map(i -> new RegisterConsentUseCase.Item(
                        i.purposeCode(), i.sourceCode(), Boolean.TRUE.equals(i.accepted()), i.validTo()))
                .toList();
        var r = register.execute(new RegisterConsentUseCase.Command(req.documento(), items, req.channel(), req.versionTermo()));
        List<Map<String, Object>> out = r.items().stream().map(it -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("consentId", it.consentId() == null ? null : it.consentId().toString());
            m.put("purposeCode", it.purposeCode());
            m.put("sourceCode", it.sourceCode());
            m.put("status", it.status());
            return m;
        }).toList();
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("documentoHash", r.documentoHash());
        body.put("items", out);
        return ResponseEntity.status(HttpStatus.CREATED).body(body);
    }

    @GetMapping("/{documento}")
    @Operation(summary = "Lista consentimentos do titular")
    public Map<String, Object> list(@PathVariable String documento) {
        var r = list.execute(new ListConsentsUseCase.Query(documento));
        List<Map<String, Object>> consents = r.consents().stream().map(c -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("consentId", c.consentId().toString());
            m.put("purposeCode", c.purposeCode());
            m.put("sourceCode", c.sourceCode());
            m.put("status", c.status());
            return m;
        }).toList();
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("documento", r.documento());
        body.put("consents", consents);
        return body;
    }

    @DeleteMapping("/{consentId}")
    @Operation(summary = "Revoga consentimento")
    public Map<String, Object> revoke(@PathVariable UUID consentId) {
        var r = revoke.execute(new RevokeConsentUseCase.Command(consentId));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("consentId", r.consentId().toString());
        body.put("status", r.status());
        return body;
    }
}
