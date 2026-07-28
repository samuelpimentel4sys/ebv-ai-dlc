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
import br.com.ebv.prisma.domain.fairness.exception.FairnessNotFoundException;
import br.com.ebv.prisma.domain.fairness.exception.FairnessValidationException;
import br.com.ebv.prisma.domain.policysim.exception.PolicySimulationNotFoundException;
import br.com.ebv.prisma.domain.policysim.exception.PolicySimulationValidationException;
import br.com.ebv.prisma.domain.review.exception.ReviewConflictException;
import br.com.ebv.prisma.domain.review.exception.ReviewNotFoundException;
import br.com.ebv.prisma.domain.review.exception.ReviewValidationException;
import br.com.ebv.prisma.domain.credential.exception.CredentialConflictException;
import br.com.ebv.prisma.domain.credential.exception.CredentialNotFoundException;
import br.com.ebv.prisma.domain.credential.exception.CredentialValidationException;
import br.com.ebv.prisma.domain.dispute.exception.DisputeConflictException;
import br.com.ebv.prisma.domain.dispute.exception.DisputeForbiddenException;
import br.com.ebv.prisma.domain.dispute.exception.DisputeLockoutException;
import br.com.ebv.prisma.domain.dispute.exception.DisputeNotFoundException;
import br.com.ebv.prisma.domain.dispute.exception.DisputeUnauthorizedException;
import br.com.ebv.prisma.domain.dispute.exception.DisputeValidationException;
import br.com.ebv.prisma.domain.onboarding.exception.OnboardingConflictException;
import br.com.ebv.prisma.domain.onboarding.exception.OnboardingNotFoundException;
import br.com.ebv.prisma.domain.onboarding.exception.OnboardingValidationException;
import br.com.ebv.prisma.domain.consent.exception.ConsentNotFoundException;
import br.com.ebv.prisma.domain.consent.exception.ConsentValidationException;
import br.com.ebv.prisma.domain.utilitylink.exception.UtilityLinkNotFoundException;
import br.com.ebv.prisma.domain.utilitylink.exception.UtilityLinkValidationException;
import br.com.ebv.prisma.domain.altdata.exception.AltDataValidationException;
import br.com.ebv.prisma.domain.thinfile.exception.ThinfileNotFoundException;
import br.com.ebv.prisma.domain.thinfile.exception.ThinfileValidationException;
import br.com.ebv.prisma.domain.coach.exception.CoachNotFoundException;
import br.com.ebv.prisma.domain.coach.exception.CoachValidationException;
import br.com.ebv.prisma.domain.mission.exception.MissionNotFoundException;
import br.com.ebv.prisma.domain.mission.exception.MissionValidationException;
import br.com.ebv.prisma.domain.marketplace.exception.MarketplaceNotFoundException;
import br.com.ebv.prisma.domain.marketplace.exception.MarketplaceValidationException;
import br.com.ebv.prisma.domain.portfolio.exception.PortfolioNotFoundException;
import br.com.ebv.prisma.domain.liveness.exception.LivenessConflictException;
import br.com.ebv.prisma.domain.liveness.exception.LivenessForbiddenException;
import br.com.ebv.prisma.domain.liveness.exception.LivenessLockoutException;
import br.com.ebv.prisma.domain.liveness.exception.LivenessPreconditionException;
import br.com.ebv.prisma.domain.liveness.exception.LivenessProviderException;
import br.com.ebv.prisma.domain.liveness.exception.LivenessValidationException;
import br.com.ebv.prisma.domain.pj.exception.PjConflictException;
import br.com.ebv.prisma.domain.pj.exception.PjForbiddenException;
import br.com.ebv.prisma.domain.pj.exception.PjNotFoundException;
import br.com.ebv.prisma.domain.pj.exception.PjValidationException;
import br.com.ebv.prisma.domain.portfolio.exception.PortfolioValidationException;
import br.com.ebv.prisma.domain.sla.exception.SlaConflictException;
import br.com.ebv.prisma.domain.sla.exception.SlaNotFoundException;
import br.com.ebv.prisma.domain.sla.exception.SlaValidationException;
import br.com.ebv.prisma.domain.subjectrequest.exception.SubjectRequestConflictException;
import br.com.ebv.prisma.domain.subjectrequest.exception.SubjectRequestNotFoundException;
import br.com.ebv.prisma.domain.subjectrequest.exception.SubjectRequestValidationException;
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
            DossierNotFoundException.class,
            ReviewNotFoundException.class,
            FairnessNotFoundException.class,
            SubjectRequestNotFoundException.class,
            PolicySimulationNotFoundException.class,
            DisputeNotFoundException.class,
            SlaNotFoundException.class,
            OnboardingNotFoundException.class,
            CredentialNotFoundException.class,
            ConsentNotFoundException.class,
            UtilityLinkNotFoundException.class,
            ThinfileNotFoundException.class,
            CoachNotFoundException.class,
            MissionNotFoundException.class,
            MarketplaceNotFoundException.class,
            PortfolioNotFoundException.class,
            PjNotFoundException.class
    })
    public ResponseEntity<Map<String, Object>> notFound(RuntimeException ex, HttpServletRequest req) {
        return error(HttpStatus.NOT_FOUND, ex.getMessage(), req, List.of());
    }

    @ExceptionHandler({CyclicMergeException.class, MergeUndoNotAllowedException.class,
            ModelImmutableException.class, AmbiguousIdentityException.class, ChainBrokenException.class,
            ReplayConflictException.class, PolicyConflictException.class, ReasonConflictException.class,
            ReviewConflictException.class, SubjectRequestConflictException.class,
            DisputeConflictException.class, SlaConflictException.class, OnboardingConflictException.class,
            CredentialConflictException.class, PjConflictException.class, LivenessConflictException.class})
    public ResponseEntity<Map<String, Object>> conflict(RuntimeException ex, HttpServletRequest req) {
        return error(HttpStatus.CONFLICT, ex.getMessage(), req, List.of());
    }

    @ExceptionHandler(LivenessPreconditionException.class)
    public ResponseEntity<Map<String, Object>> precondition(LivenessPreconditionException ex, HttpServletRequest req) {
        return error(HttpStatus.PRECONDITION_FAILED, ex.getMessage(), req, List.of());
    }

    @ExceptionHandler(SchemaIncompatibleException.class)
    public ResponseEntity<Map<String, Object>> schemaConflict(SchemaIncompatibleException ex, HttpServletRequest req) {
        return error(HttpStatus.CONFLICT, ex.getMessage(), req, List.of());
    }

    @ExceptionHandler({UnprocessableEventException.class, MetricsGateException.class, FeatureLeakageException.class,
            ReplayValidationException.class, PolicyValidationException.class, ReasonValidationException.class,
            AuditValidationException.class, ReviewValidationException.class, FairnessValidationException.class,
            SubjectRequestValidationException.class, PolicySimulationValidationException.class,
            DisputeValidationException.class, SlaValidationException.class,
            OnboardingValidationException.class, CredentialValidationException.class,
            ConsentValidationException.class, UtilityLinkValidationException.class,
            AltDataValidationException.class, ThinfileValidationException.class,
            CoachValidationException.class, MissionValidationException.class,
            MarketplaceValidationException.class, PortfolioValidationException.class,
            PjValidationException.class, LivenessValidationException.class})
    public ResponseEntity<Map<String, Object>> unprocessable(RuntimeException ex, HttpServletRequest req) {
        return error(HttpStatus.UNPROCESSABLE_ENTITY, ex.getMessage(), req, List.of());
    }

    @ExceptionHandler({ConsentDeniedException.class, TraceForbiddenException.class, ReplayForbiddenException.class,
            DisputeForbiddenException.class, PjForbiddenException.class, LivenessForbiddenException.class})
    public ResponseEntity<Map<String, Object>> forbidden(RuntimeException ex, HttpServletRequest req) {
        return error(HttpStatus.FORBIDDEN, ex.getMessage(), req, List.of());
    }

    @ExceptionHandler(DisputeUnauthorizedException.class)
    public ResponseEntity<Map<String, Object>> unauthorized(DisputeUnauthorizedException ex, HttpServletRequest req) {
        return error(HttpStatus.UNAUTHORIZED, ex.getMessage(), req, List.of());
    }

    @ExceptionHandler({DisputeLockoutException.class, LivenessLockoutException.class})
    public ResponseEntity<Map<String, Object>> lockout(RuntimeException ex, HttpServletRequest req) {
        return error(HttpStatus.TOO_MANY_REQUESTS, ex.getMessage(), req, List.of());
    }

    @ExceptionHandler({ModelUnavailableException.class, WormWriteException.class, SnapshotUnavailableException.class,
            AuditWormWriteException.class, LivenessProviderException.class})
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
