package br.com.ebv.prisma.infrastructure.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.access.AccessDeniedHandler;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.stream.Collectors;

/**
 * Lab visibility: Access Denied Spring (role) era silencioso no log.
 * Grava WARN com path + authorities do JWT.
 */
public final class LoggingAccessDeniedHandler implements AccessDeniedHandler {

    private static final Logger log = LoggerFactory.getLogger(LoggingAccessDeniedHandler.class);

    @Override
    public void handle(
            HttpServletRequest request,
            HttpServletResponse response,
            AccessDeniedException accessDeniedException
    ) throws IOException {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String principal = auth != null ? String.valueOf(auth.getName()) : "anonymous";
        String roles = auth == null ? "-" : auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.joining(","));
        String cid = MDC.get("correlationId");
        log.warn(
                "ACCESS_DENIED method={} path={} principal={} authorities={} correlationId={} msg={}",
                request.getMethod(),
                request.getRequestURI(),
                principal,
                roles,
                cid,
                accessDeniedException.getMessage()
        );
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        byte[] body = (
                "{\"status\":403,\"error\":\"Forbidden\",\"message\":\"Access Denied — role insufficient\","
                        + "\"path\":\"" + request.getRequestURI() + "\","
                        + "\"correlationId\":\"" + (cid == null ? "" : cid) + "\"}"
        ).getBytes(StandardCharsets.UTF_8);
        response.getOutputStream().write(body);
    }
}
