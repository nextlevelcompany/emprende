package com.cajachambala.prestamos.api;

import com.cajachambala.prestamos.application.PrestamoService;
import com.cajachambala.prestamos.application.dto.PrestamoDtos.*;
import com.cajachambala.prestamos.domain.PrestamoEstado;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/prestamos")
public class PrestamoController {

    private final PrestamoService prestamoService;

    public PrestamoController(PrestamoService prestamoService) {
        this.prestamoService = prestamoService;
    }

    @PostMapping("/simular")
    @PreAuthorize("hasAnyRole('ADMIN', 'SOCIO')")
    public ResponseEntity<SimulacionPrestamoResponse> simular(@Valid @RequestBody SimularPrestamoRequest request) {
        SimulacionPrestamoResponse response = prestamoService.simular(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PrestamoResponse> solicitar(@Valid @RequestBody SolicitarPrestamoRequest request) {
        PrestamoResponse response = prestamoService.solicitar(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<PrestamoResponse>> listar(
            @RequestParam(required = false) UUID socioId,
            @RequestParam(required = false) PrestamoEstado estado,
            @PageableDefault(size = 20, sort = "numero", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        Page<PrestamoResponse> response = prestamoService.listar(socioId, estado, pageable);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/resumen")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResumenCarteraResponse> obtenerResumenCartera() {
        ResumenCarteraResponse response = prestamoService.obtenerResumenCartera();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SOCIO')")
    public ResponseEntity<PrestamoDetalleResponse> obtenerDetalle(@PathVariable UUID id) {
        PrestamoDetalleResponse response = prestamoService.obtenerDetalle(id);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/aprobar")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PrestamoResponse> aprobar(
            @PathVariable UUID id,
            @RequestBody(required = false) AprobarPrestamoRequest request
    ) {
        AprobarPrestamoRequest req = request != null ? request : new AprobarPrestamoRequest(null);
        PrestamoResponse response = prestamoService.aprobar(id, req);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/rechazar")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PrestamoResponse> rechazar(
            @PathVariable UUID id,
            @RequestParam(required = false) String motivo
    ) {
        PrestamoResponse response = prestamoService.rechazar(id, motivo);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/desembolsar")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PrestamoDetalleResponse> desembolsar(
            @PathVariable UUID id,
            @Valid @RequestBody DesembolsarPrestamoRequest request
    ) {
        PrestamoDetalleResponse response = prestamoService.desembolsar(id, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/cuotas/{cuotaId}/pagar")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PrestamoDetalleResponse> registrarPagoCuota(
            @PathVariable UUID id,
            @PathVariable UUID cuotaId,
            @Valid @RequestBody RegistrarPagoCuotaRequest request
    ) {
        PrestamoDetalleResponse response = prestamoService.registrarPagoCuota(id, cuotaId, request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/asamblea")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PrestamoDetalleResponse> editarPrestamoAsamblea(
            @PathVariable UUID id,
            @Valid @RequestBody EditarPrestamoRequest request
    ) {
        PrestamoDetalleResponse response = prestamoService.editarPrestamoAsamblea(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}/asamblea")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> eliminarPrestamoAsamblea(
            @PathVariable UUID id,
            @Valid @RequestBody EliminarPrestamoRequest request
    ) {
        prestamoService.eliminarPrestamoAsamblea(id, request);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/cuotas")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PrestamoDetalleResponse> modificarCuotasPrestamo(
            @PathVariable UUID id,
            @Valid @RequestBody ModificarCuotasPrestamoRequest request
    ) {
        PrestamoDetalleResponse response = prestamoService.modificarCuotasPrestamo(id, request);
        return ResponseEntity.ok(response);
    }
}
