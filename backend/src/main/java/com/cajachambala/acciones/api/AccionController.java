package com.cajachambala.acciones.api;

import com.cajachambala.acciones.application.AccionService;
import com.cajachambala.acciones.application.dto.AccionDtos.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/acciones")
public class AccionController {

    private final AccionService accionService;

    public AccionController(AccionService accionService) {
        this.accionService = accionService;
    }

    @GetMapping("/resumen")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResumenMatriculaDto> getResumen() {
        return ResponseEntity.ok(accionService.getResumenMatricula());
    }

    @GetMapping("/socios")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<SocioMatriculaDto>> listarSocios() {
        return ResponseEntity.ok(accionService.listarSociosMatricula());
    }

    @GetMapping("/certificados")
    @PreAuthorize("hasAnyRole('ADMIN', 'SOCIO')")
    public ResponseEntity<List<CertificadoAccionDto>> listarCertificados(
            @RequestParam(required = false) UUID socioId,
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) String buscar
    ) {
        return ResponseEntity.ok(accionService.listarCertificados(socioId, estado, buscar));
    }

    @GetMapping("/certificados/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CertificadoAccionDto> obtenerCertificado(@PathVariable UUID id) {
        return ResponseEntity.ok(accionService.obtenerCertificado(id));
    }

    @GetMapping("/transferencias")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<TransferenciaAccionDto>> listarTransferencias() {
        return ResponseEntity.ok(accionService.listarTransferencias());
    }

    @PostMapping("/transferencias")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TransferenciaAccionDto> registrarTransferencia(
            @Valid @RequestBody RegistrarTransferenciaRequest request
    ) {
        TransferenciaAccionDto response = accionService.registrarTransferencia(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
