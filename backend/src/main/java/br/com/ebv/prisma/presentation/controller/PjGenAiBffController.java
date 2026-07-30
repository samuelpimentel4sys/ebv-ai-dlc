package br.com.ebv.prisma.presentation.controller;

import br.com.ebv.prisma.domain.pj.port.out.GenAiGatewayPort;
import io.swagger.v3.oas.annotations.Hidden;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.Enumeration;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * BFF GenAI — FE fala só com Java :8080; Noah encaminha para Emilly :8090.
 * HITL (submit/approve/trail) permanece em {@link PjHitlController}.
 */
@RestController
@RequestMapping("/api/v1/pj")
@Tag(name = "PJ GenAI BFF", description = "Ponte Noah → Emilly Python (ou stub em showcase)")
public class PjGenAiBffController {

    private static final Set<String> HOP_BY_HOP = Set.of(
            "connection", "keep-alive", "proxy-authenticate", "proxy-authorization",
            "te", "trailers", "transfer-encoding", "upgrade", "host", "content-length"
    );

    private final GenAiGatewayPort gateway;

    public PjGenAiBffController(GenAiGatewayPort gateway) {
        this.gateway = gateway;
    }

    @GetMapping("/genai/health")
    @Operation(summary = "Health do GenAI Python via BFF")
    public ResponseEntity<byte[]> genaiHealth() {
        var up = gateway.forward("GET", "/health", null, null, Map.of());
        return respond(up);
    }

    @Hidden
    @RequestMapping(
            value = "/**",
            method = {
                    RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT,
                    RequestMethod.PATCH, RequestMethod.DELETE
            }
    )
    public ResponseEntity<byte[]> proxy(HttpServletRequest request) throws IOException {
        String uri = request.getRequestURI();
        if (isHitlOwned(uri)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "HITL path handled by PjHitlController");
        }
        if (uri.endsWith("/genai/health")) {
            return genaiHealth();
        }

        String query = request.getQueryString();
        String pathAndQuery = uri + (query != null && !query.isBlank() ? "?" + query : "");

        byte[] body = request.getInputStream().readAllBytes();
        String contentType = request.getContentType();
        Map<String, String> forward = new LinkedHashMap<>();
        Enumeration<String> names = request.getHeaderNames();
        while (names != null && names.hasMoreElements()) {
            String name = names.nextElement();
            if (name == null || HOP_BY_HOP.contains(name.toLowerCase(Locale.ROOT))) {
                continue;
            }
            // Content-Type tratado no adapter; Authorization e correlation passam
            if ("content-type".equalsIgnoreCase(name)) {
                continue;
            }
            forward.put(name, request.getHeader(name));
        }

        var up = gateway.forward(request.getMethod(), pathAndQuery, body, contentType, forward);
        return respond(up);
    }

    static boolean isHitlOwned(String uri) {
        if (uri == null) {
            return false;
        }
        String u = uri.toLowerCase(Locale.ROOT);
        return u.matches(".*/api/v1/pj/opinions/[^/]+/submit/?")
                || u.matches(".*/api/v1/pj/opinions/[^/]+/approve/?")
                || u.matches(".*/api/v1/pj/opinions/[^/]+/trail/?");
    }

    private static ResponseEntity<byte[]> respond(GenAiGatewayPort.UpstreamResponse up) {
        HttpHeaders headers = new HttpHeaders();
        if (up.contentType() != null) {
            headers.set(HttpHeaders.CONTENT_TYPE, up.contentType());
        } else {
            headers.setContentType(MediaType.APPLICATION_JSON);
        }
        headers.set("X-Prisma-Bff", "genai");
        headers.set("X-Prisma-Lab", "true");
        return new ResponseEntity<>(up.body(), headers, HttpStatus.valueOf(up.status()));
    }
}
