package br.com.ebv.prisma.domain.dispute.port.in;

import java.time.Instant;
import java.time.LocalDate;

public interface IdentifySelfServiceUseCase {

    record Command(String documento, LocalDate birthDate, String lastDigits) {}

    record Result(String sessionToken, boolean verified, Instant expiresAt) {}

    Result execute(Command command);
}
