package br.com.ebv.prisma.presentation.controller;

import br.com.ebv.prisma.domain.liveness.port.in.CreateLivenessSessionUseCase;
import br.com.ebv.prisma.domain.liveness.port.in.RegisterBiometricConsentUseCase;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Liveness", description = "EP05-F01 Biometria / Liveness (Noah)")
public class LivenessSessionController {

    private final CreateLivenessSessionUseCase createSession;
    private final RegisterBiometricConsentUseCase registerConsent;

    public LivenessSessionController(
            CreateLivenessSessionUseCase createSession,
            RegisterBiometricConsentUseCase registerConsent
    ) {
        this.createSession = createSession;
        this.registerConsent = registerConsent;
    }

    @PostMapping("/biometric-consent")
    @Operation(summary = "Registra consentimento biométrico LGPD (lab/pré-req RN006)")
    public Map<String, Object> consent(@Valid @RequestBody ConsentRequest req) {
        var r = registerConsent.execute(new RegisterBiometricConsentUseCase.Command(
                req.customer_id(), req.term_version(), req.ip_address(), req.user_agent()
        ));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("customer_id", r.customerId().toString());
        body.put("term_version", r.termVersion());
        body.put("status", r.status());
        return body;
    }

    @PostMapping("/liveness/session")
    @Operation(summary = "Cria sessão Face Liveness (stub|http mock|aws)")
    public ResponseEntity<Map<String, Object>> create(
            @Valid @RequestBody CreateSessionRequest req,
            @RequestHeader(value = "X-Idempotency-Key", required = false) String idempotencyKey,
            Authentication authentication,
            HttpServletRequest http
    ) {
        UUID actor = resolveActor(authentication, req.actor_customer_id());
        String platform = req.device_info() != null ? req.device_info().platform() : null;
        String appVersion = req.device_info() != null ? req.device_info().app_version() : null;
        String ip = req.device_info() != null && req.device_info().ip_address() != null
                ? req.device_info().ip_address()
                : http.getRemoteAddr();
        String deviceId = req.device_info() != null ? req.device_info().device_id() : null;
        String channel = req.audit_context() != null ? req.audit_context().channel() : "MOBILE_APP";
        String payloadHash = sha256(req.customer_id() + "|" + platform + "|" + appVersion + "|" + channel);

        var r = createSession.execute(new CreateLivenessSessionUseCase.Command(
                req.customer_id(),
                actor,
                new CreateLivenessSessionUseCase.DeviceInfo(platform, appVersion, ip, deviceId),
                channel,
                idempotencyKey,
                payloadHash
        ));

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("session_id", r.sessionId());
        body.put("customer_id", r.customerId().toString());
        body.put("status", r.status());
        body.put("created_at", r.createdAt().toString());
        body.put("expires_at", r.expiresAt().toString());
        body.put("from_cache", r.fromCache());

        return ResponseEntity.status(HttpStatus.CREATED)
                .header("Location", "/api/v1/auth/liveness/session/" + r.sessionId())
                .body(body);
    }

    private static UUID resolveActor(Authentication authentication, UUID labActor) {
        if (authentication != null && authentication.getPrincipal() instanceof Jwt jwt) {
            String sub = jwt.getSubject();
            if (sub != null && !sub.isBlank()) {
                try {
                    return UUID.fromString(sub);
                } catch (IllegalArgumentException ignored) {
                    return UUID.nameUUIDFromBytes(sub.getBytes(StandardCharsets.UTF_8));
                }
            }
        }
        return labActor;
    }

    private static String sha256(String raw) {
        try {
            byte[] dig = MessageDigest.getInstance("SHA-256").digest(raw.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(dig);
        } catch (Exception e) {
            return Integer.toHexString(raw.hashCode());
        }
    }

    public record DeviceInfo(String platform, String app_version, String ip_address, String device_id) {}

    public record AuditContext(String channel) {}

    public record CreateSessionRequest(
            @NotNull UUID customer_id,
            DeviceInfo device_info,
            AuditContext audit_context,
            UUID actor_customer_id
    ) {}

    public record ConsentRequest(
            @NotNull UUID customer_id,
            String term_version,
            String ip_address,
            String user_agent
    ) {}
}
