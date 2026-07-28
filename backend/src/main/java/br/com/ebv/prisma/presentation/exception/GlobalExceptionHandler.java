package br.com.ebv.prisma.presentation.exception;

import br.com.ebv.prisma.domain.audit.exception.AuditNotFoundException;
import br.com.ebv.prisma.domain.audit.exception.AuditValidationException;
import br.com.ebv.prisma.domain.audit.exception.AuditWormWriteException;
import br.com.ebv.prisma.domain.counterfactual.exception.CounterfactualNotFoundException;
import br.com.ebv.prisma.domain.decision.exception.ChainBrokenException;
import br.com.ebv.prisma.domain.decision.exception.DecisionNotFoundException;
import br.com.ebv.prisma.domain.decision.exception.SnapshotUnavailableException;
import br.com.ebv.prisma.domain.decision.exception.WormWriteException;
import br.com.ebv.prisma.domain.dossier.exception.DossierNotFoundException;
import br.com.ebv.prisma.domain.explain.exception.ExplanationNotFoundException;
import br.com.ebv.prisma.domain.events.exception.SchemaIncompatibleException;
import br.com.ebv.prisma.domain.events.exception.UnprocessableEventException;
import br.com.ebv.prisma.domain.features.exception.AmbiguousIdentityException;
import br.com.ebv.prisma.domain.features.exception.FeatureLeakageException;
import br.com.ebv.prisma.domain.features.exception.FeatureNotFoundException;
import br.com.ebv.prisma.domain.identity.exception.CyclicMergeException;
import br.com.ebv.prisma.domain.identity.exception.GoldenRecordNotFoundException;
import br.com.ebv.prisma.domain.identity.exception.MergeUndoNotAllowedException;
import br.com.ebv.prisma.domain.ingest.exception.ConsentDeniedException;
import br.com.ebv.prisma.domain.observability.exception.TraceForbiddenException;
import br.com.ebv.prisma.domain.observability.exception.TraceNotFoundException;
import br.com.ebv.prisma.domain.policy.exception.PolicyConflictException;
import br.com.ebv.prisma.domain.policy.exception.PolicyNotFoundException;
import br.com.ebv.prisma.domain.policy.exception.PolicyValidationException;
import br.com.ebv.prisma.domain.reason.exception.ReasonConflictException;
import br.com.ebv.prisma.domain.reason.exception.ReasonNotFoundException;
import br.com.ebv.prisma.domain.reason.exception.ReasonValidationException;
import br.com.ebv.prisma.domain.replay.exception.ReplayConflictException;
import br.com.ebv.prisma.domain.replay.exception.ReplayForbiddenException;
import br.com.ebv.prisma.domain.replay.exception.ReplayNotFoundException;
import br.com.ebv.prisma.domain.replay.exception.ReplayValidationException;
import br.com.ebv.prisma.domain.scoring.exception.MetricsGateException;
import br.com.ebv.prisma.domain.scoring.exception.ModelImmutableException;
import br.com.ebv.prisma.domain.scoring.exception.ModelNotFoundException;
import br.com.ebv.prisma.domain.scoring.exception.ModelUnavailableException;
import br.com.ebv.prisma.infrastructure.config.CorrelationIdFilter;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler({
            GoldenRecordNotFoundException.class,
            ModelNotFoundException.class,
            FeatureNotFoundException.class,
            DecisionNotFoundException.class,
            TraceNotFoundException.class,
            ReplayNotFoundException.class,
            PolicyNotFoundException.class,
            ReasonNotFoundException.class,
            AuditNotFoundException.class,
            ExplanationNotFoundException.class,
            CounterfactualNotFoundException.class,
            DossierNotFoundException.class
    })
    public ResponseEntity<Map<String, Object>> notFound(RuntimeException ex, HttpServletRequest req) {
        return error(HttpStatus.NOT_FOUND, ex.getMessage(), req, List.of());
    }

    @ExceptionHandler({CyclicMergeException.class, MergeUndoNotAllowedException.class,
            ModelImmutableException.class, AmbiguousIdentityException.class, ChainBrokenException.class,
            ReplayConflictException.class, PolicyConflictException.class, ReasonConflictException.class})
    public ResponseEntity<Map<String, Object>> conflict(RuntimeException ex, HttpServletRequest req) {
        return error(HttpStatus.CONFLICT, ex.getMessage(), req, List.of());
    }

    @ExceptionHandler(SchemaIncompatibleException.class)
    public ResponseEntity<Map<String, Object>> schemaConflict(SchemaIncompatibleException ex, HttpServletRequest req) {
        return error(HttpStatus.CONFLICT, ex.getMessage(), req, List.of());
    }

    @ExceptionHandler({UnprocessableEventException.class, MetricsGateException.class, FeatureLeakageException.class,
            ReplayValidationException.class, PolicyValidationException.class, ReasonValidationException.class,
            AuditValidationException.class})
    public ResponseEntity<Map<String, Object>> unprocessable(RuntimeException ex, HttpServletRequest req) {
        return error(HttpStatus.UNPROCESSABLE_ENTITY, ex.getMessage(), req, List.of());
    }

    @ExceptionHandler({ConsentDeniedException.class, TraceForbiddenException.class, ReplayForbiddenException.class})
    public ResponseEntity<Map<String, Object>> forbidden(RuntimeException ex, HttpServletRequest req) {
        return error(HttpStatus.FORBIDDEN, ex.getMessage(), req, List.of());
    }

    @ExceptionHandler({ModelUnavailableException.class, WormWriteException.class, SnapshotUnavailableException.class,
            AuditWormWriteException.class})
    public ResponseEntity<Map<String, Object>> serviceUnavailable(RuntimeException ex, HttpServletRequest req) {
        return error(HttpStatus.SERVICE_UNAVAILABLE, ex.getMessage(), req, List.of());
    }

    @ExceptionHandler({IllegalArgumentException.class, IllegalStateException.class})
    public ResponseEntity<Map<String, Object>> badRequest(RuntimeException ex, HttpServletRequest req) {
        return error(HttpStatus.BAD_REQUEST, ex.getMessage(), req, List.of());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> validation(MethodArgumentNotValidException ex, HttpServletRequest req) {
        List<Map<String, Object>> details = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> Map.<String, Object>of(
                        "field", fe.getField(),
                        "message", fe.getDefaultMessage() != null ? fe.getDefaultMessage() : "inválido",
                        "rejectedValue", fe.getRejectedValue() != null ? fe.getRejectedValue() : ""
                ))
                .toList();
        return error(HttpStatus.BAD_REQUEST, "Validação falhou", req, details);
    }

    private static ResponseEntity<Map<String, Object>> error(
            HttpStatus status, String message, HttpServletRequest req, List<?> details
    ) {
        Object attr = req.getAttribute(CorrelationIdFilter.ATTR);
        String correlationId = attr != null ? attr.toString() : UUID.randomUUID().toString();
        return ResponseEntity.status(status)
                .header(CorrelationIdFilter.HEADER, correlationId)
                .body(Map.of(
                        "timestamp", Instant.now().toString(),
                        "status", status.value(),
                        "error", status.getReasonPhrase(),
                        "message", message,
                        "path", req.getRequestURI(),
                        "correlationId", correlationId,
                        "details", details
                ));
    }
}
