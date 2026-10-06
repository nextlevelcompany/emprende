package com.cajachambala.identidad.infrastructure.audit;

import com.cajachambala.identidad.domain.AuditLog;
import com.cajachambala.identidad.domain.UserRole;
import com.cajachambala.identidad.infrastructure.persistence.AuditLogRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    public AuditService(AuditLogRepository auditLogRepository, ObjectMapper objectMapper) {
        this.auditLogRepository = auditLogRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void registrar(
            UUID cajaId,
            UUID actorUserId,
            UserRole actorRole,
            String accion,
            String entidad,
            UUID entidadId,
            Object antes,
            Object despues,
            String ip,
            String userAgent
    ) {
        String antesJson = toJson(antes);
        String despuesJson = toJson(despues);
        log(cajaId, actorUserId, actorRole, accion, entidad, entidadId, antesJson, despuesJson, ip, userAgent, null);
    }

    private String toJson(Object obj) {
        if (obj == null) return null;
        if (obj instanceof String s) return s;
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            return String.valueOf(obj);
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(
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
        AuditLog auditLog = AuditLog.create(
                cajaId,
                actorUserId,
                actorRole,
                accion,
                entidad,
                entidadId,
                antesJson,
                despuesJson,
                ip,
                userAgent,
                requestId
        );
        auditLogRepository.save(auditLog);
    }

    public void logSecurityEvent(
            UUID cajaId,
            UUID actorUserId,
            UserRole actorRole,
            String accion,
            String detalle,
            HttpServletRequest request
    ) {
        String ip = (request != null) ? getClientIp(request) : null;
        String userAgent = (request != null) ? request.getHeader("User-Agent") : null;
        String reqIdHeader = (request != null) ? request.getHeader("X-Request-ID") : null;
        UUID requestId = null;
        try {
            if (reqIdHeader != null) requestId = UUID.fromString(reqIdHeader);
        } catch (Exception ignored) {}

        String jsonDetalle = (detalle != null) ? "{\"detalle\":\"" + detalle + "\"}" : null;
        log(cajaId, actorUserId, actorRole, accion, "SEGURIDAD", actorUserId, null, jsonDetalle, ip, userAgent, requestId);
    }

    public static String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
