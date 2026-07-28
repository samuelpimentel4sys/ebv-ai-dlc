package br.com.ebv.prisma.presentation.controller;

import br.com.ebv.prisma.domain.policy.port.in.DiffPolicyVersionsUseCase;
import br.com.ebv.prisma.domain.policy.port.in.ListPolicyVersionsUseCase;
import br.com.ebv.prisma.domain.policy.port.in.PublishPolicyVersionUseCase;
import br.com.ebv.prisma.presentation.dto.policy.PublishPolicyRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/policy/versions")
@Tag(name = "Policy", description = "PRISMA-EP-02-F10 Governança de versões de política")
public class PolicyController {

    private final ListPolicyVersionsUseCase listVersions;
    private final DiffPolicyVersionsUseCase diffVersions;
    private final PublishPolicyVersionUseCase publishVersion;

    public PolicyController(
            ListPolicyVersionsUseCase listVersions,
            DiffPolicyVersionsUseCase diffVersions,
            PublishPolicyVersionUseCase publishVersion
    ) {
        this.listVersions = listVersions;
        this.diffVersions = diffVersions;
        this.publishVersion = publishVersion;
    }

    @GetMapping
    @Operation(summary = "Lista versões de política")
    public Map<String, Object> list(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String author,
            @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        var result = listVersions.execute(new ListPolicyVersionsUseCase.Query(status, author, from, to, page, size));
        List<Map<String, Object>> items = result.items().stream().map(i -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("policy_version_id", i.id().toString());
            m.put("version", i.version());
            m.put("status", i.status());
            m.put("artifact_hash", i.artifactHash());
            m.put("author", i.author());
            m.put("approval_id", i.approvalId());
            m.put("effective_at", i.effectiveAt() != null ? i.effectiveAt().toString() : null);
            m.put("created_at", i.createdAt().toString());
            m.put("published_at", i.publishedAt() != null ? i.publishedAt().toString() : null);
            m.put("immutable", i.immutable());
            return m;
        }).toList();
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("items", items);
        body.put("page", result.page());
        body.put("size", result.size());
        body.put("total_elements", result.totalElements());
        body.put("total_pages", result.totalPages());
        return body;
    }

    @GetMapping("/{a}/diff/{b}")
    @Operation(summary = "Diff entre duas versões de política")
    public Map<String, Object> diff(
            @PathVariable UUID a,
            @PathVariable UUID b,
            @RequestParam(name = "include_unchanged", defaultValue = "false") boolean includeUnchanged
    ) {
        var r = diffVersions.execute(a, b, includeUnchanged);
        List<Map<String, Object>> changes = r.changes().stream().map(c -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("path", c.path());
            m.put("from_value", c.fromValue());
            m.put("to_value", c.toValue());
            m.put("change_type", c.changeType());
            m.put("business_effect", c.businessEffect());
            return m;
        }).toList();
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("from_version_id", r.fromVersionId().toString());
        body.put("to_version_id", r.toVersionId().toString());
        body.put("from_version", r.fromVersion());
        body.put("to_version", r.toVersion());
        body.put("changes", changes);
        body.put("business_effects", r.businessEffects());
        return body;
    }

    @PostMapping("/{id}/publish")
    @Operation(summary = "Publica versão DRAFT imutável")
    public ResponseEntity<Map<String, Object>> publish(
            @PathVariable UUID id,
            @Valid @RequestBody PublishPolicyRequest req
    ) {
        var r = publishVersion.execute(new PublishPolicyVersionUseCase.Command(
                id, req.approvalId(), req.effectiveAt(), req.releaseNote(), req.expectedDraftHash()
        ));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("policy_version_id", r.policyVersionId().toString());
        body.put("version", r.version());
        body.put("status", r.status());
        body.put("artifact_hash", r.artifactHash());
        body.put("git_commit", r.gitCommit());
        body.put("approved_by", r.approvedBy());
        body.put("effective_at", r.effectiveAt().toString());
        return ResponseEntity.status(HttpStatus.CREATED).body(body);
    }
}
