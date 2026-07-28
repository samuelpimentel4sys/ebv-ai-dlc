package br.com.ebv.prisma.infrastructure.adapter.persistence.credential;

import br.com.ebv.prisma.domain.credential.port.out.CredentialRepositoryPort;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;

@Component
@Transactional
public class CredentialRepositoryAdapter implements CredentialRepositoryPort {

    private final ApiCredentialJpaRepository jpa;

    public CredentialRepositoryAdapter(ApiCredentialJpaRepository jpa) {
        this.jpa = jpa;
    }

    @Override
    public void save(CredentialRecord record) {
        ApiCredentialEntity e = new ApiCredentialEntity();
        e.setId(record.id());
        e.setClientId(record.clientId());
        e.setSecretHash(record.secretHash());
        e.setScopes(record.scopesJson());
        e.setEnv(record.env());
        e.setStatus(record.status());
        e.setRateLimit(record.rateLimit());
        e.setTenantId(record.tenantId());
        e.setCreatedAt(OffsetDateTime.ofInstant(record.createdAt(), ZoneOffset.UTC));
        e.setRotatedAt(record.rotatedAt() == null ? null : OffsetDateTime.ofInstant(record.rotatedAt(), ZoneOffset.UTC));
        jpa.save(e);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<CredentialRecord> findById(UUID id) {
        return jpa.findById(id).map(e -> new CredentialRecord(
                e.getId(), e.getClientId(), e.getSecretHash(), e.getScopes(), e.getEnv(),
                e.getStatus(), e.getRateLimit(), e.getTenantId(),
                e.getCreatedAt().toInstant(),
                e.getRotatedAt() == null ? null : e.getRotatedAt().toInstant()
        ));
    }
}
