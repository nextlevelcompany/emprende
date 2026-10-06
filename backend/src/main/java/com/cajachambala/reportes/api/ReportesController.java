package com.cajachambala.reportes.api;

import com.cajachambala.reportes.application.ReportesService;
import com.cajachambala.reportes.application.dto.ReportesDtos.*;
import com.cajachambala.shared.infrastructure.security.UserContext;
import com.cajachambala.shared.infrastructure.security.UserContextHolder;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
    @PreAuthorize("hasAnyRole('ADMIN', 'DIRECTIVO', 'SOCIO')")
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
        UUID cajaId = getCajaIdActual();
        ReporteSocioEstadoCuentaResponse response = reportesService.obtenerReporteEstadoCuentaSocio(cajaId, socioId);
        return ResponseEntity.ok(response);
    }

    private UUID getCajaIdActual() {
        UserContext ctx = UserContextHolder.getContext();
        return (ctx != null && ctx.cajaId() != null) ? ctx.cajaId() : UUID.fromString("a0000000-0000-0000-0000-000000000001");
    }
}
