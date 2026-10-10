package com.cajachambala.shared.infrastructure.security;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class RlsContextManager {

    private final RlsContextSigner contextSigner;

    @PersistenceContext
    private EntityManager entityManager;

    public RlsContextManager(RlsContextSigner contextSigner) {
        this.contextSigner = contextSigner;
    }

    public void setPostgresRlsContext(UUID cajaId, UUID socioId, String role) {
        if (cajaId == null) return;
        entityManager.createNativeQuery(
                "SELECT set_config('app.caja_id', :cajaId, true), " +
                "       set_config('app.socio_id', :socioId, true), " +
                "       set_config('app.role', :role, true), " +
                "       set_config('app.context_signature', :signature, true)"
        )
        .setParameter("cajaId", cajaId.toString())
        .setParameter("socioId", socioId != null ? socioId.toString() : "")
        .setParameter("role", role != null ? role.toUpperCase(java.util.Locale.ROOT) : "")
        .setParameter("signature", contextSigner.sign(cajaId, socioId, role))
        .getSingleResult();
    }
}
