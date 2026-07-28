package br.com.ebv.prisma.application.dispute;

import br.com.ebv.prisma.domain.dispute.exception.DisputeValidationException;
import br.com.ebv.prisma.domain.dispute.port.in.OpenDisputeUseCase;
import br.com.ebv.prisma.domain.dispute.port.out.DisputeRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.Locale;
import java.util.UUID;

@Service
public class OpenDisputeService implements OpenDisputeUseCase {

    public static final String STATUS_OPEN = "OPEN";
    private static final long SLA_CALENDAR_DAYS = 7;
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final char[] PROTO_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789".toCharArray();

    private final DisputeRepositoryPort repo;

    public OpenDisputeService(DisputeRepositoryPort repo) {
        this.repo = repo;
    }

    @Override
    @Transactional
    public Result execute(Command command) {
        if (command.documento() == null || command.documento().isBlank()) {
            throw new IllegalArgumentException("documento obrigatório");
        }
        String digits = command.documento().replaceAll("\\D", "");
        if (digits.length() != 11 && digits.length() != 14) {
            throw new DisputeValidationException("documento deve ter 11 ou 14 dígitos");
        }
        if (command.reasonCode() == null || command.reasonCode().isBlank()) {
            throw new DisputeValidationException("reason_code obrigatório");
        }
        if (command.description() == null || command.description().trim().length() < 20) {
            throw new DisputeValidationException("description mínimo 20 caracteres");
        }

        UUID id = UUID.randomUUID();
        Instant now = Instant.now();
        Instant dueAt = now.plus(SLA_CALENDAR_DAYS, ChronoUnit.DAYS);
        String protocol = "CT-" + LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE) + "-" + randomSuffix(4);
        String channel = command.channel() == null || command.channel().isBlank()
                ? "API"
                : command.channel().trim().toUpperCase(Locale.ROOT);
        String desc = command.description().trim();
        if (command.recordRef() != null && !command.recordRef().isBlank()) {
            desc = desc + " [record_ref=" + command.recordRef().trim() + "]";
        }

        repo.save(new DisputeRepositoryPort.DisputeRecord(
                id, protocol, digits, STATUS_OPEN,
                command.reasonCode().trim().toUpperCase(Locale.ROOT),
                desc, channel, dueAt, null, null, null, now
        ));
        repo.appendTimeline(id, "OPENED", "Contestação aberta — SLA lab +7 dias", "SYSTEM", now);

        return new Result(id, protocol, STATUS_OPEN, dueAt);
    }

    private static String randomSuffix(int len) {
        StringBuilder sb = new StringBuilder(len);
        for (int i = 0; i < len; i++) {
            sb.append(PROTO_CHARS[RANDOM.nextInt(PROTO_CHARS.length)]);
        }
        return sb.toString();
    }
}
