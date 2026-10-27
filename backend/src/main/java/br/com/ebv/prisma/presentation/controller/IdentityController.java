package br.com.ebv.prisma.presentation.controller;

import br.com.ebv.prisma.domain.identity.model.GoldenRecord;
import br.com.ebv.prisma.domain.identity.model.GoldenRecordId;
import br.com.ebv.prisma.domain.identity.port.in.GetIdentityUseCase;
import br.com.ebv.prisma.domain.identity.port.in.ListCandidatesUseCase;
import br.com.ebv.prisma.domain.identity.port.in.MergeIdentityUseCase;
import br.com.ebv.prisma.domain.identity.port.in.UndoMergeUseCase;
import br.com.ebv.prisma.infrastructure.config.LabActorResolver;
import br.com.ebv.prisma.presentation.dto.identity.CandidateResponse;
import br.com.ebv.prisma.presentation.dto.identity.IdentityResponse;
import br.com.ebv.prisma.presentation.dto.identity.MergeIdentityRequest;
import br.com.ebv.prisma.presentation.dto.identity.UndoMergeRequest;
import br.com.ebv.prisma.presentation.dto.identity.UndoMergeResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/identity")
@Tag(name = "Identity", description = "PRISMA-EP-01-F07 Golden Record")
public class IdentityController {

    private final GetIdentityUseCase getIdentityUseCase;
    private final MergeIdentityUseCase mergeIdentityUseCase;
    private final UndoMergeUseCase undoMergeUseCase;
    private final ListCandidatesUseCase listCandidatesUseCase;
    private final LabActorResolver labActorResolver;

    public IdentityController(
            GetIdentityUseCase getIdentityUseCase,
            MergeIdentityUseCase mergeIdentityUseCase,
            UndoMergeUseCase undoMergeUseCase,
            ListCandidatesUseCase listCandidatesUseCase,
            LabActorResolver labActorResolver
    ) {
        this.getIdentityUseCase = getIdentityUseCase;
        this.mergeIdentityUseCase = mergeIdentityUseCase;
        this.undoMergeUseCase = undoMergeUseCase;
        this.listCandidatesUseCase = listCandidatesUseCase;
        this.labActorResolver = labActorResolver;
    }

    @GetMapping("/{documento}")
    @Operation(summary = "Golden record atual por documento")
    public IdentityResponse getByDocumento(@PathVariable String documento) {
        return toResponse(getIdentityUseCase.execute(documento));
    }

    @PostMapping("/merge")
    @Operation(summary = "Mescla identidades (humano / steward)")
    public IdentityResponse merge(
            @Valid @RequestBody MergeIdentityRequest request,
            Authentication authentication
    ) {
        UUID actor = labActorResolver.resolve(null, authentication);
        GoldenRecord result = mergeIdentityUseCase.execute(new MergeIdentityUseCase.MergeCommand(
                GoldenRecordId.of(request.survivorGrId()),
                GoldenRecordId.of(request.mergedGrId()),
                request.confidence(),
                request.reason(),
                actor
        ));
        return toResponse(result);
    }

    @PostMapping("/merge/undo")
    @Operation(summary = "Desfaz merge e publica correção (CA-04 / RN002)")
    public UndoMergeResponse undo(
            @Valid @RequestBody UndoMergeRequest request,
            Authentication authentication
    ) {
        UUID actor = labActorResolver.resolve(null, authentication);
        UndoMergeUseCase.UndoResult result = undoMergeUseCase.execute(new UndoMergeUseCase.UndoCommand(
                GoldenRecordId.of(request.survivorGrId()),
                GoldenRecordId.of(request.mergedGrId()),
                actor
        ));
        return new UndoMergeResponse(
                result.restored().getId().value(),
                result.restored().getStatus().name(),
                result.restored().getVersion(),
                result.survivor().getId().value(),
                result.survivor().getVersion(),
                result.kafkaTopic(),
                result.kafkaOffset()
        );
    }

    @GetMapping("/candidates")
    @Operation(summary = "Fila de candidatos à revisão humana")
    public ResponseEntity<List<CandidateResponse>> candidates() {
        List<CandidateResponse> body = listCandidatesUseCase.execute().stream()
                .map(c -> new CandidateResponse(
                        c.id(),
                        c.leftGr().value(),
                        c.rightGr().value(),
                        c.confidence(),
                        c.status()
                ))
                .toList();
        return ResponseEntity.ok(body);
    }

    private static IdentityResponse toResponse(GoldenRecord gr) {
        return new IdentityResponse(
                gr.getId().value(),
                gr.getVersion(),
                gr.getCanonicalDocumento().value(),
                gr.getStatus().name(),
                gr.linkCount()
        );
    }
}
