package br.com.ebv.prisma.domain.port.out;

import br.com.ebv.prisma.domain.model.Titular;

import java.util.Optional;

public interface TitularRepositoryPort {

    Optional<Titular> findByDocumento(Titular.Documento documento);

    Optional<Titular> findById(Titular.TitularId id);

    Titular save(Titular titular);
}
