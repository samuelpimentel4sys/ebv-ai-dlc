package br.com.ebv.prisma.domain.model;

import java.util.Objects;
import java.util.UUID;

/**
 * Aggregate root — Titular (golden record).
 * Domínio puro: zero Spring/JPA.
 */
public final class Titular {

    private final TitularId id;
    private final Documento documento;
    private String nome;
    private StatusTitular status;

    public Titular(TitularId id, Documento documento, String nome) {
        this.id = Objects.requireNonNull(id, "id obrigatório");
        this.documento = Objects.requireNonNull(documento, "documento obrigatório");
        this.nome = nome;
        this.status = StatusTitular.ATIVO;
    }

    public void renomear(String novoNome) {
        if (novoNome == null || novoNome.isBlank()) {
            throw new IllegalArgumentException("Nome inválido");
        }
        this.nome = novoNome.trim();
    }

    public void desativar() {
        if (status == StatusTitular.INATIVO) {
            throw new IllegalStateException("Titular já inativo");
        }
        this.status = StatusTitular.INATIVO;
    }

    public TitularId getId() {
        return id;
    }

    public Documento getDocumento() {
        return documento;
    }

    public String getNome() {
        return nome;
    }

    public StatusTitular getStatus() {
        return status;
    }

    public record TitularId(UUID value) {
        public TitularId {
            Objects.requireNonNull(value, "TitularId nulo");
        }

        public static TitularId generate() {
            return new TitularId(UUID.randomUUID());
        }
    }

    public record Documento(String value, TipoDocumento tipo) {
        public Documento {
            Objects.requireNonNull(value, "documento nulo");
            Objects.requireNonNull(tipo, "tipo nulo");
            String digits = value.replaceAll("\\D", "");
            if (tipo == TipoDocumento.CPF && digits.length() != 11) {
                throw new IllegalArgumentException("CPF deve ter 11 dígitos");
            }
            if (tipo == TipoDocumento.CNPJ && digits.length() != 14) {
                throw new IllegalArgumentException("CNPJ deve ter 14 dígitos");
            }
            value = digits;
        }
    }

    public enum TipoDocumento {
        CPF, CNPJ
    }

    public enum StatusTitular {
        ATIVO, INATIVO
    }
}
