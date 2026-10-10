package com.cajachambala.utilidades.api;

import com.cajachambala.utilidades.application.DistribucionUtilidadService;
import com.cajachambala.utilidades.application.dto.UtilidadDtos.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/utilidades")
public class DistribucionUtilidadController {

    private final DistribucionUtilidadService distribucionService;

    public DistribucionUtilidadController(DistribucionUtilidadService distribucionService) {
        this.distribucionService = distribucionService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<DistribucionResponse>> listar() {
        List<DistribucionResponse> lista = distribucionService.listar();
        return ResponseEntity.ok(lista);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DistribucionResponse> obtenerPorId(@PathVariable UUID id) {
        DistribucionResponse response = distribucionService.obtener(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/mi-detalle")
    @PreAuthorize("hasRole('SOCIO')")
    public ResponseEntity<DetalleDistribucionResponse> obtenerMiDetalle(@PathVariable UUID id) {
        return ResponseEntity.ok(distribucionService.obtenerMiDetalle(id));
    }

    @GetMapping("/resumen/{ejercicio}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResumenEjercicioResponse> obtenerResumen(@PathVariable Short ejercicio) {
        ResumenEjercicioResponse response = distribucionService.obtenerResumenEjercicio(ejercicio);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/simular")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DistribucionResponse> simular(@Valid @RequestBody SimularDistribucionRequest request) {
        DistribucionResponse response = distribucionService.simular(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DistribucionResponse> guardarBorrador(@Valid @RequestBody GuardarDistribucionRequest request) {
        DistribucionResponse response = distribucionService.guardarBorrador(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/{id}/aprobar")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DistribucionResponse> aprobar(@PathVariable UUID id) {
        DistribucionResponse response = distribucionService.aprobar(id);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/pagar")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DistribucionResponse> pagar(
            @PathVariable UUID id,
            @Valid @RequestBody PagarDistribucionRequest request
    ) {
        DistribucionResponse response = distribucionService.pagar(id, request);
        return ResponseEntity.ok(response);
    }
}
