package br.com.ebv.prisma.presentation.controller;

import br.com.ebv.prisma.domain.onboarding.port.in.CompleteOnboardingUseCase;
import br.com.ebv.prisma.domain.onboarding.port.in.StartOnboardingUseCase;
import br.com.ebv.prisma.domain.onboarding.port.in.VerifyOnboardingUseCase;
import br.com.ebv.prisma.presentation.dto.onboarding.CompleteOnboardingRequest;
import br.com.ebv.prisma.presentation.dto.onboarding.StartOnboardingRequest;
import br.com.ebv.prisma.presentation.dto.onboarding.VerifyOnboardingRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/onboarding")
@Tag(name = "Onboarding", description = "PRISMA-EP-05-F03 Onboarding PME")
public class OnboardingController {

    private final StartOnboardingUseCase start;
    private final VerifyOnboardingUseCase verify;
    private final CompleteOnboardingUseCase complete;

    public OnboardingController(
            StartOnboardingUseCase start,
            VerifyOnboardingUseCase verify,
            CompleteOnboardingUseCase complete
    ) {
        this.start = start;
        this.verify = verify;
        this.complete = complete;
    }

    @PostMapping("/start")
    @Operation(summary = "Inicia onboarding PME")
    public ResponseEntity<Map<String, Object>> start(@Valid @RequestBody StartOnboardingRequest req) {
        var r = start.execute(new StartOnboardingUseCase.Command(req.cnpj(), req.legalName(), req.representative()));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("id", r.id().toString());
        body.put("status", r.status());
        return ResponseEntity.status(HttpStatus.CREATED).body(body);
    }

    @PostMapping("/{id}/verify")
    @Operation(summary = "Verifica CNPJ/representante (Serpro stub)")
    public Map<String, Object> verify(
            @PathVariable UUID id,
            @RequestBody(required = false) VerifyOnboardingRequest req
    ) {
        boolean force = req != null && Boolean.TRUE.equals(req.forceManualQueue());
        var r = verify.execute(new VerifyOnboardingUseCase.Command(id, force));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("id", r.id().toString());
        body.put("status", r.status());
        body.put("verification", r.verification());
        return body;
    }

    @PostMapping("/{id}/complete")
    @Operation(summary = "Aceite contratual + credencial SANDBOX via F07")
    public Map<String, Object> complete(
            @PathVariable UUID id,
            @Valid @RequestBody CompleteOnboardingRequest req
    ) {
        var r = complete.execute(new CompleteOnboardingUseCase.Command(
                id, req.contractVersion(), Boolean.TRUE.equals(req.accepted()), req.billingEmail()
        ));
        Map<String, Object> cred = new LinkedHashMap<>();
        cred.put("id", r.credential().id().toString());
        cred.put("clientId", r.credential().clientId());
        cred.put("secret", r.credential().secret());
        cred.put("scopes", r.credential().scopes());
        cred.put("env", r.credential().env());
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("onboardingId", r.onboardingId().toString());
        body.put("status", r.status());
        body.put("tenantId", r.tenantId());
        body.put("credential", cred);
        body.put("durationSeconds", r.durationSeconds());
        return body;
    }
}
