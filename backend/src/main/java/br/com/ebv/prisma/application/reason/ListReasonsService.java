package br.com.ebv.prisma.application.reason;

import br.com.ebv.prisma.domain.reason.port.in.ListReasonsUseCase;
import br.com.ebv.prisma.domain.reason.port.out.ReasonVersionRepositoryPort;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ListReasonsService implements ListReasonsUseCase {

    private final ReasonVersionRepositoryPort repo;
    private final ObjectMapper objectMapper;

    public ListReasonsService(ReasonVersionRepositoryPort repo, ObjectMapper objectMapper) {
        this.repo = repo;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional(readOnly = true)
    public Page execute(Query query) {
        int page = Math.max(0, query.page());
        int size = query.size() <= 0 ? 20 : Math.min(query.size(), 100);
        var result = repo.search(query.status(), query.channel(), page, size);
        var items = result.items().stream()
                .map(r -> new Item(
                        r.id(), r.code(), r.version(), r.status(),
                        r.consumerText(), r.analystText(),
                        parseChannels(r.channelsJson()),
                        r.legalApproval(), r.createdAt()
                ))
                .toList();
        return new Page(items, result.page(), result.size(), result.totalElements(), result.totalPages());
    }

    private List<String> parseChannels(String json) {
        try {
            return objectMapper.readValue(json == null ? "[]" : json, new TypeReference<>() {});
        } catch (Exception e) {
            return List.of();
        }
    }
}
