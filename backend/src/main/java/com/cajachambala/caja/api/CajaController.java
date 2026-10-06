package com.cajachambala.caja.api;

import com.cajachambala.caja.application.CajaService;
import com.cajachambala.caja.application.dto.CajaDtos.*;
import com.cajachambala.caja.domain.FlujoTipo;
import com.cajachambala.caja.domain.OperacionEstado;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping
public class CajaController {

    private final CajaService cajaService;

    public CajaController(CajaService cajaService) {
        this.cajaService = cajaService;
    }

    // ==========================================
    // Periodos
    // ==========================================

    @PostMapping("/periodos")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PeriodoResponse> crearPeriodo(@Valid @RequestBody CrearPeriodoRequest request) {
        PeriodoResponse response = cajaService.crearPeriodo(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/periodos")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<PeriodoResponse>> listarPeriodos() {
        List<PeriodoResponse> response = cajaService.listarPeriodos();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/periodos/abierto")
    @PreAuthorize("hasAnyRole('ADMIN', 'SOCIO')")
    public ResponseEntity<PeriodoResponse> obtenerPeriodoAbierto() {
        PeriodoResponse response = cajaService.obtenerPeriodoAbiertoActual();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/periodos/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SOCIO')")
    public ResponseEntity<PeriodoResponse> obtenerPeriodo(@PathVariable UUID id) {
        PeriodoResponse response = cajaService.obtenerPeriodo(id);
        return ResponseEntity.ok(response);
    }

    // ==========================================
    // Planilla Mensual (Excel)
    // ==========================================

    @GetMapping("/periodos/{id}/planilla")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PlanillaMensualResponse> obtenerPlanilla(@PathVariable UUID id) {
        PlanillaMensualResponse response = cajaService.obtenerPlanillaMensual(id);
        return ResponseEntity.ok(response);
    }

    // ==========================================
    // Operaciones
    // ==========================================

    @PostMapping("/periodos/{id}/operaciones")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<OperacionResponse> registrarOperacion(
            @PathVariable UUID id,
            @Valid @RequestBody RegistrarOperacionRequest request
    ) {
        OperacionResponse response = cajaService.registrarOperacion(id, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/periodos/{id}/operaciones")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<OperacionResponse>> listarOperaciones(
            @PathVariable UUID id,
            @RequestParam(required = false) FlujoTipo tipo,
            @RequestParam(required = false) OperacionEstado estado
    ) {
        List<OperacionResponse> response = cajaService.listarOperaciones(id, tipo, estado);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/operaciones/{id}/anular")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<OperacionResponse> anularOperacion(
            @PathVariable UUID id,
            @Valid @RequestBody AnularOperacionRequest request
    ) {
        OperacionResponse response = cajaService.anularOperacion(id, request);
        return ResponseEntity.ok(response);
    }

    // ==========================================
    // Arqueo de Caja
    // ==========================================

    @PostMapping("/periodos/{id}/arqueo")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ArqueoResponse> registrarArqueo(
            @PathVariable UUID id,
            @Valid @RequestBody RegistrarArqueoRequest request
    ) {
        ArqueoResponse response = cajaService.registrarArqueo(id, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/periodos/{id}/arqueo")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ArqueoResponse> obtenerArqueo(@PathVariable UUID id) {
        ArqueoResponse response = cajaService.obtenerArqueo(id);
        return ResponseEntity.ok(response);
    }

    // ==========================================
    // Cierre y Reapertura
    // ==========================================

    @PostMapping("/periodos/{id}/cerrar")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CierrePeriodoResponse> cerrarPeriodo(@PathVariable UUID id) {
        CierrePeriodoResponse response = cajaService.cerrarPeriodo(id);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/periodos/{id}/reabrir")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PeriodoResponse> reabrirPeriodo(
            @PathVariable UUID id,
            @Valid @RequestBody ReabrirPeriodoRequest request
    ) {
        PeriodoResponse response = cajaService.reabrirPeriodo(id, request);
        return ResponseEntity.ok(response);
    }

    // ==========================================
    // Catálogos
    // ==========================================

    @GetMapping("/conceptos")
    @PreAuthorize("hasAnyRole('ADMIN', 'SOCIO')")
    public ResponseEntity<List<ConceptoResponse>> listarConceptos() {
        List<ConceptoResponse> response = cajaService.listarConceptos();
        return ResponseEntity.ok(response);
    }
}
