package br.com.ebv.prisma.application.dispute;

import br.com.ebv.prisma.domain.dispute.exception.DisputeConflictException;
import br.com.ebv.prisma.domain.dispute.exception.DisputeNotFoundException;
import br.com.ebv.prisma.domain.dispute.exception.DisputeValidationException;
import br.com.ebv.prisma.domain.dispute.port.in.GetEvidencePackUseCase;
import br.com.ebv.prisma.domain.dispute.port.in.ListDisputeAttachmentsUseCase;
import br.com.ebv.prisma.domain.dispute.port.in.UploadDisputeAttachmentUseCase;
import br.com.ebv.prisma.domain.dispute.port.out.DisputeAttachmentRepositoryPort;
import br.com.ebv.prisma.domain.dispute.port.out.DisputeEvidenceStorePort;
import br.com.ebv.prisma.domain.dispute.port.out.DisputeRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class DisputeAttachmentService
        implements UploadDisputeAttachmentUseCase, ListDisputeAttachmentsUseCase, GetEvidencePackUseCase {

    private static final Set<String> ALLOWED_MIME = Set.of(
            "application/pdf", "image/png", "image/jpeg"
    );
    private static final long MAX_BYTES = 10 * 1024 * 1024;
    private static final int MAX_ATTACHMENTS = 10;

    private final DisputeRepositoryPort disputes;
    private final DisputeAttachmentRepositoryPort attachments;
    private final DisputeEvidenceStorePort store;

    public DisputeAttachmentService(
            DisputeRepositoryPort disputes,
            DisputeAttachmentRepositoryPort attachments,
            DisputeEvidenceStorePort store
    ) {
        this.disputes = disputes;
        this.attachments = attachments;
        this.store = store;
    }

    @Override
    @Transactional
    public UploadDisputeAttachmentUseCase.Result execute(UploadDisputeAttachmentUseCase.Command command) {
        disputes.findById(command.disputeId())
                .orElseThrow(() -> new DisputeNotFoundException("Dispute não encontrada: " + command.disputeId()));

        if (command.filename() == null || command.filename().isBlank()) {
            throw new IllegalArgumentException("filename obrigatório");
        }
        if (command.content() == null || command.content().length == 0) {
            throw new IllegalArgumentException("content obrigatório");
        }
        if (command.content().length > MAX_BYTES) {
            throw new DisputeValidationException("arquivo excede 10 MB");
        }

        String mime = command.contentType() == null ? "" : command.contentType().trim().toLowerCase(Locale.ROOT);
        if (!ALLOWED_MIME.contains(mime)) {
            throw new DisputeValidationException("MIME não permitido: " + mime);
        }

        // ClamAV stub — refuse EICAR signature
        String asText = new String(command.content(), StandardCharsets.ISO_8859_1);
        if (asText.contains("EICAR-STANDARD-ANTIVIRUS-TEST-FILE")) {
            throw new DisputeValidationException("AV positivo (lab stub) — arquivo rejeitado");
        }

        List<DisputeAttachmentRepositoryPort.AttachmentRecord> existing =
                attachments.findByDisputeId(command.disputeId());
        if (existing.size() >= MAX_ATTACHMENTS) {
            throw new DisputeValidationException("máximo 10 anexos por dispute");
        }

        if (command.prevAttachmentId() != null) {
            attachments.findById(command.prevAttachmentId())
                    .orElseThrow(() -> new DisputeNotFoundException(
                            "prev_attachment_id não encontrado: " + command.prevAttachmentId()));
        }

        UUID id = UUID.randomUUID();
        Instant now = Instant.now();
        String sha = sha256(command.content());
        String uri;
        try {
            uri = store.store(command.disputeId(), id, command.content());
        } catch (DisputeConflictException e) {
            throw e;
        }

        attachments.save(new DisputeAttachmentRepositoryPort.AttachmentRecord(
                id, command.disputeId(), command.filename().trim(), mime, sha, uri,
                command.prevAttachmentId(), now
        ));
        disputes.appendTimeline(command.disputeId(), "ATTACHMENT_ADDED",
                "Anexo " + command.filename().trim(), "SYSTEM", now);

        return new UploadDisputeAttachmentUseCase.Result(
                id, command.filename().trim(), mime, sha, "STORED_IMMUTABLE", now
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<ListDisputeAttachmentsUseCase.Item> execute(ListDisputeAttachmentsUseCase.Query query) {
        disputes.findById(query.disputeId())
                .orElseThrow(() -> new DisputeNotFoundException("Dispute não encontrada: " + query.disputeId()));
        return attachments.findByDisputeId(query.disputeId()).stream()
                .map(a -> new ListDisputeAttachmentsUseCase.Item(
                        a.id(), a.filename(), a.contentType(), a.sha256(),
                        a.prevAttachmentId(), a.createdAt()))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public GetEvidencePackUseCase.Result execute(GetEvidencePackUseCase.Query query) {
        disputes.findById(query.disputeId())
                .orElseThrow(() -> new DisputeNotFoundException("Dispute não encontrada: " + query.disputeId()));

        var files = attachments.findByDisputeId(query.disputeId()).stream()
                .map(a -> new GetEvidencePackUseCase.FileEntry(
                        a.id(), a.filename(), a.contentType(), a.sha256(), a.storageUri()))
                .toList();

        String manifest = files.stream()
                .map(f -> f.id() + "|" + f.filename() + "|" + f.sha256())
                .collect(Collectors.joining("\n"));
        String manifestHash = sha256(manifest.getBytes(StandardCharsets.UTF_8));

        return new GetEvidencePackUseCase.Result(manifestHash, files);
    }

    private static String sha256(byte[] content) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(md.digest(content));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }
}
