package com.cajachambala.socios.api;

import com.cajachambala.socios.application.SocioService;
import com.cajachambala.socios.application.dto.SocioDtos.*;
import com.cajachambala.socios.domain.SocioEstado;
import com.cajachambala.socios.domain.SocioTipo;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/socios")
public class SocioController {

    private final SocioService socioService;

    public SocioController(SocioService socioService) {
        this.socioService = socioService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SocioResponse> crear(@Valid @RequestBody CrearSocioRequest request) {
        SocioResponse response = socioService.crearSocio(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<SocioResponse>> listar(
            @RequestParam(required = false) SocioTipo tipo,
            @RequestParam(required = false) SocioEstado estado,
            @RequestParam(required = false) String q,
            @PageableDefault(size = 20, sort = "codigo", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        Page<SocioResponse> response = socioService.listarSocios(tipo, estado, q, pageable);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/activos")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<SocioResponse>> listarActivos() {
        List<SocioResponse> response = socioService.listarTodos(true);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SocioResponse> obtenerPorId(@PathVariable UUID id) {
        SocioResponse response = socioService.obtenerSocio(id);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SocioResponse> actualizar(
            @PathVariable UUID id,
            @RequestBody ActualizarSocioRequest request
    ) {
        SocioResponse response = socioService.actualizarSocio(id, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/baja")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SocioResponse> darDeBaja(
            @PathVariable UUID id,
            @Valid @RequestBody BajaSocioRequest request
    ) {
        SocioResponse response = socioService.darDeBaja(id, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/acceso")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> habilitarAcceso(
            @PathVariable UUID id,
            @Valid @RequestBody HabilitarAccesoRequest request
    ) {
        socioService.habilitarAccesoWeb(id, request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}
