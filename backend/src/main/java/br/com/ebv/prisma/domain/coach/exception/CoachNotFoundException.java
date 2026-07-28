package br.com.ebv.prisma.domain.coach.exception;

public class CoachNotFoundException extends RuntimeException {
    public CoachNotFoundException(String message) { super(message); }
}
