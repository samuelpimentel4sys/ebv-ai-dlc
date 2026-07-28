package br.com.ebv.prisma.domain.identity.model;

import java.util.Objects;

/** Documento canônico (CPF 11 ou CNPJ 14 dígitos). */
public record DocumentoCanonico(String value) {
    public DocumentoCanonico {
        Objects.requireNonNull(value, "documento nulo");
        String digits = value.replaceAll("\\D", "");
        if (digits.length() != 11 && digits.length() != 14) {
            throw new IllegalArgumentException("Documento deve ter 11 (CPF) ou 14 (CNPJ) dígitos");
        }
        value = digits;
    }
}
