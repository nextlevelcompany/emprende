package com.cajachambala.directiva.api;

import com.cajachambala.directiva.application.DirectivaService;
import com.cajachambala.directiva.application.dto.DirectivaDtos.DirectivaCargoDto;
import com.cajachambala.directiva.application.dto.DirectivaDtos.GuardarDirectivaRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/directiva")
public class DirectivaController {

    private final DirectivaService directivaService;

    public DirectivaController(DirectivaService directivaService) {
        this.directivaService = directivaService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SOCIO')")
    public ResponseEntity<List<DirectivaCargoDto>> listarCargos(
            @RequestParam(required = false, defaultValue = "false") boolean soloActivos
    ) {
        if (soloActivos) {
            return ResponseEntity.ok(directivaService.listarCargosActivos());
        }
        return ResponseEntity.ok(directivaService.listarCargos());
    }

    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<DirectivaCargoDto>> guardarDirectiva(
            @Valid @RequestBody GuardarDirectivaRequest request
    ) {
        return ResponseEntity.ok(directivaService.guardarDirectiva(request));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<DirectivaCargoDto>> crearOActualizarDirectiva(
            @Valid @RequestBody GuardarDirectivaRequest request
    ) {
        return ResponseEntity.ok(directivaService.guardarDirectiva(request));
    }
}
