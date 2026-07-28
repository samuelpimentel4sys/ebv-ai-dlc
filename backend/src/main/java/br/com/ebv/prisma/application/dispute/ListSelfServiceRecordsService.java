package br.com.ebv.prisma.application.dispute;

import br.com.ebv.prisma.domain.dispute.exception.DisputeUnauthorizedException;
import br.com.ebv.prisma.domain.dispute.port.in.ListSelfServiceRecordsUseCase;
import br.com.ebv.prisma.domain.dispute.port.out.SelfServiceSessionPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ListSelfServiceRecordsService implements ListSelfServiceRecordsUseCase {

    private final SelfServiceSessionPort sessions;

    public ListSelfServiceRecordsService(SelfServiceSessionPort sessions) {
        this.sessions = sessions;
    }

    @Override
    @Transactional(readOnly = true)
    public List<RecordItem> execute(Query query) {
        var session = sessions.findValid(query.sessionToken())
                .orElseThrow(() -> new DisputeUnauthorizedException("sessionToken inválido ou expirado"));

        String doc = session.documento();
        String suffix = doc.length() >= 4 ? doc.substring(doc.length() - 4) : doc;
        return List.of(
                new RecordItem("neg-" + suffix + "-01", "NEGATIVACAO", "Credor Lab SA", "1500.00", "ATIVA"),
                new RecordItem("neg-" + suffix + "-02", "NEGATIVACAO", "Financeira Demo", "320.50", "ATIVA")
        );
    }
}
