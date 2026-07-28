package br.com.ebv.prisma.application.sla;

import br.com.ebv.prisma.domain.sla.port.in.ListSlaEscalationsUseCase;
import br.com.ebv.prisma.domain.sla.port.out.SlaRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ListSlaEscalationsService implements ListSlaEscalationsUseCase {

    private final SlaRepositoryPort slaRepo;

    public ListSlaEscalationsService(SlaRepositoryPort slaRepo) {
        this.slaRepo = slaRepo;
    }

    @Override
    @Transactional(readOnly = true)
    public List<EscalationItem> execute() {
        return slaRepo.listEscalations().stream()
                .map(e -> new EscalationItem(e.id(), e.disputeId(), e.level(), e.notifiedAt(), e.reason()))
                .toList();
    }
}
