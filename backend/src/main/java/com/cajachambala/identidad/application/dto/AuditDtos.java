package com.cajachambala.identidad.application.dto;

import com.cajachambala.identidad.domain.AuditLog;

import java.time.Instant;
import java.util.UUID;

public class AuditDtos {

    public record AuditLogResponse(
            Long id,
            Instant occurredAt,
            UUID cajaId,
            UUID actorUserId,
            String actorRole,
            String accion,
            String entidad,
            UUID entidadId,
            String antes,
            String despues,
            String ip,
            String userAgent,
            UUID requestId
    ) {
        public static AuditLogResponse fromDomain(AuditLog a) {
            return new AuditLogResponse(
                    a.getId(),
                    a.getOccurredAt(),
                    a.getCajaId(),
                    a.getActorUserId(),
                    a.getActorRole() != null ? a.getActorRole().name() : null,
                    a.getAccion(),
                    a.getEntidad(),
                    a.getEntidadId(),
                    a.getAntes(),
                    a.getDespues(),
                    a.getIp(),
                    a.getUserAgent(),
                    a.getRequestId()
            );
        }
    }
}
