package com.cajachambala.identidad.api;

import com.cajachambala.identidad.application.dto.AuditDtos.AuditLogResponse;
import com.cajachambala.identidad.domain.AuditLog;
import com.cajachambala.identidad.infrastructure.persistence.AuditLogRepository;
import com.cajachambala.shared.infrastructure.security.UserContext;
import com.cajachambala.shared.infrastructure.security.UserContextHolder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/auditoria")
public class AuditoriaController {

    private final AuditLogRepository auditLogRepository;

    public AuditoriaController(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<AuditLogResponse>> listar(
            @RequestParam(required = false) String accion,
            @RequestParam(required = false) String entidad,
            @PageableDefault(size = 50, sort = "occurredAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        UUID cajaId = getCajaIdActual();
        Page<AuditLog> page = auditLogRepository.findByCajaIdWithFilters(
                cajaId,
                (accion != null && !accion.isBlank()) ? accion.trim() : null,
                (entidad != null && !entidad.isBlank()) ? entidad.trim() : null,
                pageable
        );
        return ResponseEntity.ok(page.map(AuditLogResponse::fromDomain));
    }

    @GetMapping("/acciones")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<String>> listarAcciones() {
        UUID cajaId = getCajaIdActual();
        return ResponseEntity.ok(auditLogRepository.findDistinctAccionesByCajaId(cajaId));
    }

    @GetMapping("/entidades")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<String>> listarEntidades() {
        UUID cajaId = getCajaIdActual();
        return ResponseEntity.ok(auditLogRepository.findDistinctEntidadesByCajaId(cajaId));
    }

    private UUID getCajaIdActual() {
        UserContext ctx = UserContextHolder.getContext();
        return (ctx != null && ctx.cajaId() != null) ? ctx.cajaId() : UUID.fromString("a0000000-0000-0000-0000-000000000001");
    }
}
