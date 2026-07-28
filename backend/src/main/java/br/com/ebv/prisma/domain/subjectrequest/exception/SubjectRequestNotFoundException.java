package br.com.ebv.prisma.domain.subjectrequest.exception;

import java.util.UUID;

public class SubjectRequestNotFoundException extends RuntimeException {
    public SubjectRequestNotFoundException(UUID id) {
        super("Requisição de direito não encontrada: " + id);
    }
}
