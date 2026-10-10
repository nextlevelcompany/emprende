package com.cajachambala.reportes.api;

import com.cajachambala.reportes.application.ReportesService;
import com.cajachambala.reportes.application.dto.ReportesDtos.*;
import com.cajachambala.shared.infrastructure.security.UserContext;
import com.cajachambala.shared.infrastructure.security.UserContextHolder;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/reportes")
public class ReportesController {

    private final ReportesService reportesService;

    public ReportesController(ReportesService reportesService) {
        this.reportesService = reportesService;
    }

    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('ADMIN', 'DIRECTIVO')")
    public ResponseEntity<DashboardMetricasResponse> obtenerMetricasDashboard() {
        UUID cajaId = getCajaIdActual();
        DashboardMetricasResponse response = reportesService.obtenerMetricasDashboard(cajaId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/asamblea/periodo/{periodoId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DIRECTIVO')")
    public ResponseEntity<ReporteAsambleaResponse> obtenerReporteAsambleaPeriodo(@PathVariable UUID periodoId) {
        UUID cajaId = getCajaIdActual();
        ReporteAsambleaResponse response = reportesService.obtenerReporteAsambleaPeriodo(cajaId, periodoId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/socio/{socioId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DIRECTIVO', 'SOCIO')")
    public ResponseEntity<ReporteSocioEstadoCuentaResponse> obtenerReporteEstadoCuentaSocio(@PathVariable UUID socioId) {
        UserContext ctx = UserContextHolder.getContext();
        if (ctx == null || ctx.cajaId() == null) {
            throw new AccessDeniedException("Contexto de usuario no disponible");
        }
        if ("SOCIO".equals(ctx.role()) && !socioId.equals(ctx.socioId())) {
            throw new AccessDeniedException("Solo puedes consultar tu propio estado de cuenta");
        }
        UUID cajaId = ctx.cajaId();
        ReporteSocioEstadoCuentaResponse response = reportesService.obtenerReporteEstadoCuentaSocio(cajaId, socioId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/mi-cuenta")
    @PreAuthorize("hasRole('SOCIO')")
    public ResponseEntity<ReporteSocioEstadoCuentaResponse> obtenerMiEstadoCuenta() {
        UserContext context = UserContextHolder.getContext();
        if (context == null || context.cajaId() == null || context.socioId() == null) {
            throw new AccessDeniedException("La cuenta no está asociada a un socio");
        }
        return ResponseEntity.ok(reportesService.obtenerReporteEstadoCuentaSocio(context.cajaId(), context.socioId()));
    }

    private UUID getCajaIdActual() {
        UserContext ctx = UserContextHolder.getContext();
        return (ctx != null && ctx.cajaId() != null) ? ctx.cajaId() : UUID.fromString("a0000000-0000-0000-0000-000000000001");
    }
}
