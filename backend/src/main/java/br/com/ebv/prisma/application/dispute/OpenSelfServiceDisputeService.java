package br.com.ebv.prisma.application.dispute;

import br.com.ebv.prisma.domain.dispute.exception.DisputeUnauthorizedException;
import br.com.ebv.prisma.domain.dispute.exception.DisputeValidationException;
import br.com.ebv.prisma.domain.dispute.port.in.OpenDisputeUseCase;
import br.com.ebv.prisma.domain.dispute.port.in.OpenSelfServiceDisputeUseCase;
import br.com.ebv.prisma.domain.dispute.port.out.SelfServiceSessionPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OpenSelfServiceDisputeService implements OpenSelfServiceDisputeUseCase {

    private final SelfServiceSessionPort sessions;
    private final OpenDisputeUseCase openDispute;

    public OpenSelfServiceDisputeService(SelfServiceSessionPort sessions, OpenDisputeUseCase openDispute) {
        this.sessions = sessions;
        this.openDispute = openDispute;
    }

    @Override
    @Transactional
    public Result execute(Command command) {
        var session = sessions.findValid(command.sessionToken())
                .orElseThrow(() -> new DisputeUnauthorizedException("sessionToken inválido ou expirado"));

        if (command.reasonCode() == null || command.reasonCode().isBlank()) {
            throw new DisputeValidationException("reason_code obrigatório");
        }
        if (command.description() == null || command.description().trim().length() < 20) {
            throw new DisputeValidationException("description mínimo 20 caracteres");
        }

        var opened = openDispute.execute(new OpenDisputeUseCase.Command(
                session.documento(),
                command.reasonCode(),
                command.description(),
                "SELF_SERVICE",
                command.recordRef()
        ));

        return new Result(
                opened.id(),
                opened.protocol(),
                opened.status(),
                opened.dueAt(),
                "/acompanhamento/" + opened.protocol()
        );
    }
}
