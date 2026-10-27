package br.com.ebv.prisma.application.dispute;

import br.com.ebv.prisma.domain.dispute.exception.DisputeLockoutException;
import br.com.ebv.prisma.domain.dispute.exception.DisputeValidationException;
import br.com.ebv.prisma.domain.dispute.port.in.IdentifySelfServiceUseCase;
import br.com.ebv.prisma.domain.dispute.port.out.DisputeLockoutPort;
import br.com.ebv.prisma.domain.dispute.port.out.SelfServiceSessionPort;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
public class IdentifySelfServiceService implements IdentifySelfServiceUseCase {

    private static final long SESSION_TTL_MINUTES = 15;

    private final SelfServiceSessionPort sessions;
    private final DisputeLockoutPort lockout;

    public IdentifySelfServiceService(SelfServiceSessionPort sessions, DisputeLockoutPort lockout) {
        this.sessions = sessions;
        this.lockout = lockout;
    }

    @Override
    public Result execute(Command command) {
        if (command.documento() == null || command.documento().isBlank()) {
            throw new IllegalArgumentException("documento obrigatório");
        }
        String digits = command.documento().replaceAll("\\D", "");
        String lockKey = "identify:" + digits;

        if (lockout.isLocked(lockKey)) {
            throw new DisputeLockoutException(
                    "Bloqueado por tentativas inválidas até " + lockout.lockedUntil(lockKey));
        }

        if (command.birthDate() == null || command.lastDigits() == null || command.lastDigits().isBlank()) {
            throw new DisputeValidationException("birthDate e lastDigits obrigatórios");
        }

        boolean lengthOk = digits.length() == 11 || digits.length() == 14;
        String last4 = command.lastDigits().replaceAll("\\D", "");
        boolean factorOk = last4.length() == 4
                && digits.length() >= 4
                && digits.substring(digits.length() - 4).equals(last4);

        if (!lengthOk || !factorOk) {
            int attempts = lockout.registerFailure(lockKey);
            if (attempts >= 3) {
                throw new DisputeLockoutException("3 tentativas inválidas — lockout 30 min");
            }
            throw new DisputeValidationException("Identidade não verificada (tentativa " + attempts + "/3)");
        }

        lockout.reset(lockKey);
        Instant expires = Instant.now().plus(SESSION_TTL_MINUTES, ChronoUnit.MINUTES);
        var session = sessions.create(digits, expires);
        return new Result(session.token(), true, expires);
    }
}
