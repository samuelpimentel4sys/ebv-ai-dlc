package br.com.ebv.prisma.presentation.controller;

import br.com.ebv.prisma.domain.credential.port.in.CreateCredentialUseCase;
import br.com.ebv.prisma.domain.credential.port.in.RevokeCredentialUseCase;
import br.com.ebv.prisma.domain.credential.port.in.RotateCredentialUseCase;
import br.com.ebv.prisma.presentation.dto.credential.CreateCredentialRequest;
import br.com.ebv.prisma.presentation.dto.credential.RotateCredentialRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/credentials")
@Tag(name = "Credentials", description = "PRISMA-EP-05-F07 Ciclo de vida de credenciais API")
public class CredentialController {

    private final CreateCredentialUseCase create;
    private final RotateCredentialUseCase rotate;
    private final RevokeCredentialUseCase revoke;

    public CredentialController(
            CreateCredentialUseCase create,
            RotateCredentialUseCase rotate,
            RevokeCredentialUseCase revoke
    ) {
        this.create = create;
        this.rotate = rotate;
        this.revoke = revoke;
    }

    @PostMapping
    @Operation(summary = "Emite credencial (secret uma vez)")
    public ResponseEntity<Map<String, Object>> create(@Valid @RequestBody CreateCredentialRequest req) {
        var r = create.execute(new CreateCredentialUseCase.Command(
                req.tenantId(), req.scopes(), req.env(), req.rateLimit()
        ));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("id", r.id().toString());
        body.put("clientId", r.clientId());
        body.put("secret", r.secret());
        body.put("scopes", r.scopes());
        body.put("env", r.env());
        body.put("status", r.status());
        return ResponseEntity.status(HttpStatus.CREATED).body(body);
    }

    @PostMapping("/{id}/rotate")
    @Operation(summary = "Rotaciona secret (plaintext uma vez)")
    public Map<String, Object> rotate(
            @PathVariable UUID id,
            @RequestBody(required = false) RotateCredentialRequest req
    ) {
        boolean emergency = req != null && Boolean.TRUE.equals(req.emergency());
        Integer overlap = req != null ? req.overlapHours() : null;
        String reason = req != null ? req.reason() : null;
        var r = rotate.execute(new RotateCredentialUseCase.Command(id, emergency, overlap, reason));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("id", r.id().toString());
        body.put("clientId", r.clientId());
        body.put("secret", r.secret());
        body.put("scopes", r.scopes());
        body.put("status", r.status());
        return body;
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Revoga credencial")
    public ResponseEntity<Void> revoke(@PathVariable UUID id) {
        revoke.execute(new RevokeCredentialUseCase.Command(id));
        return ResponseEntity.noContent().build();
    }
}
