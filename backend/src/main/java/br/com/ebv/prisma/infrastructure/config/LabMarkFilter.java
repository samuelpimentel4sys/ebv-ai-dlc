package br.com.ebv.prisma.infrastructure.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * OBS-04 — marca respostas lab para FE não assumir produção.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 25)
public class LabMarkFilter extends OncePerRequestFilter {

    public static final String HEADER = "X-Prisma-Lab";

    private final boolean markResponses;

    public LabMarkFilter(@Value("${prisma.lab.mark-responses:true}") boolean markResponses) {
        this.markResponses = markResponses;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        if (markResponses) {
            response.setHeader(HEADER, "true");
        }
        filterChain.doFilter(request, response);
    }
}
