package com.cajachambala.shared.infrastructure.security;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class RlsContextManager {

    @PersistenceContext
    private EntityManager entityManager;

    public void setPostgresRlsContext(UUID cajaId, UUID socioId, String role) {
        if (cajaId == null) return;
        try {
            entityManager.createNativeQuery(
                    "SELECT set_config('app.caja_id', :cajaId, true), " +
                    "       set_config('app.socio_id', :socioId, true), " +
                    "       set_config('app.role', :role, true)"
            )
            .setParameter("cajaId", cajaId.toString())
            .setParameter("socioId", socioId != null ? socioId.toString() : "")
            .setParameter("role", role != null ? role : "")
            .getSingleResult();
        } catch (Exception ignored) {
            // Ignorado si la base de datos subyacente no admite set_config (ej. tests unitarios)
        }
    }
}
