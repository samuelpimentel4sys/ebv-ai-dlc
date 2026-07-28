package br.com.ebv.prisma.infrastructure.adapter.persistence.reason;

import br.com.ebv.prisma.domain.reason.port.out.ReasonVersionRepositoryPort;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

@Component
@Transactional
public class ReasonVersionRepositoryAdapter implements ReasonVersionRepositoryPort {

    private final ReasonVersionJpaRepository jpa;

    public ReasonVersionRepositoryAdapter(ReasonVersionJpaRepository jpa) {
        this.jpa = jpa;
    }

    @Override
    public void save(ReasonVersionRecord record) {
        ReasonVersionEntity e = new ReasonVersionEntity();
        e.setId(record.id());
        e.setCode(record.code());
        e.setVersion(record.version());
        e.setStatus(record.status());
        e.setConsumerText(record.consumerText());
        e.setAnalystText(record.analystText());
        e.setChannels(record.channelsJson());
        e.setMappingsJson(record.mappingsJson());
        e.setLegalApproval(record.legalApproval());
        e.setCreatedAt(OffsetDateTime.ofInstant(record.createdAt(), ZoneOffset.UTC));
        jpa.save(e);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<ReasonVersionRecord> findById(UUID id) {
        return jpa.findById(id).map(this::toRecord);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Integer> findMaxVersion(String code) {
        return jpa.findMaxVersion(code);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResult search(String status, String channel, int page, int size) {
        List<ReasonVersionEntity> all = jpa.searchByStatus(blankToNull(status));
        if (channel != null && !channel.isBlank()) {
            String needle = "\"" + channel.trim().toUpperCase(Locale.ROOT) + "\"";
            all = all.stream()
                    .filter(e -> e.getChannels() != null && e.getChannels().toUpperCase(Locale.ROOT).contains(needle))
                    .toList();
        }
        long total = all.size();
        int fromIdx = Math.min(page * size, all.size());
        int toIdx = Math.min(fromIdx + size, all.size());
        List<ReasonVersionRecord> items = all.subList(fromIdx, toIdx).stream().map(this::toRecord).toList();
        int totalPages = size == 0 ? 0 : (int) Math.ceil((double) total / size);
        return new PageResult(items, page, size, total, totalPages);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReasonVersionRecord> findApprovedForChannel(String channel) {
        String needle = "\"" + channel.trim().toUpperCase(Locale.ROOT) + "\"";
        return jpa.findAllApproved().stream()
                .filter(e -> e.getChannels() != null && e.getChannels().toUpperCase(Locale.ROOT).contains(needle))
                .map(this::toRecord)
                .toList();
    }

    private ReasonVersionRecord toRecord(ReasonVersionEntity e) {
        return new ReasonVersionRecord(
                e.getId(), e.getCode(), e.getVersion(), e.getStatus(),
                e.getConsumerText(), e.getAnalystText(), e.getChannels(),
                e.getMappingsJson(), e.getLegalApproval(), e.getCreatedAt().toInstant()
        );
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
