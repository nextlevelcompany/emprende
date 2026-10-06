package com.cajachambala.identidad.domain;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcType;
import org.hibernate.dialect.PostgreSQLEnumJdbcType;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "audit_log")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "occurred_at", nullable = false, updatable = false)
    private Instant occurredAt;

    @Column(name = "caja_id")
    private UUID cajaId;

    @Column(name = "actor_user_id")
    private UUID actorUserId;

    @Enumerated(EnumType.STRING)
    @JdbcType(PostgreSQLEnumJdbcType.class)
    @Column(name = "actor_role")
    private UserRole actorRole;

    @Column(nullable = false, length = 60)
    private String accion;

    @Column(length = 60)
    private String entidad;

    @Column(name = "entidad_id")
    private UUID entidadId;

    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private String antes;

    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private String despues;

    @org.hibernate.annotations.ColumnTransformer(write = "?::inet")
    @Column(columnDefinition = "inet")
    private String ip;

    @Column(name = "user_agent", columnDefinition = "text")
    private String userAgent;

    @Column(name = "request_id")
    private UUID requestId;

    protected AuditLog() {
        // Para JPA
    }

    public static AuditLog create(
            UUID cajaId,
            UUID actorUserId,
            UserRole actorRole,
            String accion,
            String entidad,
            UUID entidadId,
            String antesJson,
            String despuesJson,
            String ip,
            String userAgent,
            UUID requestId
    ) {
        AuditLog log = new AuditLog();
        log.occurredAt = Instant.now();
        log.cajaId = cajaId;
        log.actorUserId = actorUserId;
        log.actorRole = actorRole;
        log.accion = accion;
        log.entidad = entidad;
        log.entidadId = entidadId;
        log.antes = antesJson;
        log.despues = despuesJson;
        log.ip = (ip != null && !ip.isBlank()) ? ip.trim() : null;
        log.userAgent = userAgent;
        log.requestId = requestId;
        return log;
    }

    public Long getId() { return id; }
    public Instant getOccurredAt() { return occurredAt; }
    public UUID getCajaId() { return cajaId; }
    public UUID getActorUserId() { return actorUserId; }
    public UserRole getActorRole() { return actorRole; }
    public String getAccion() { return accion; }
    public String getEntidad() { return entidad; }
    public UUID getEntidadId() { return entidadId; }
    public String getAntes() { return antes; }
    public String getDespues() { return despues; }
    public String getIp() { return ip; }
    public String getUserAgent() { return userAgent; }
    public UUID getRequestId() { return requestId; }
}
