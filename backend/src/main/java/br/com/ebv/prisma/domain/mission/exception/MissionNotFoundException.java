package br.com.ebv.prisma.domain.mission.exception;

public class MissionNotFoundException extends RuntimeException {
    public MissionNotFoundException(String message) { super(message); }
}
