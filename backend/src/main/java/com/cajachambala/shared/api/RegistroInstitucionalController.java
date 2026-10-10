package com.cajachambala.shared.api;

import com.cajachambala.shared.application.RegistroInstitucionalService;
import com.cajachambala.shared.infrastructure.security.UserContext;
import com.cajachambala.shared.infrastructure.security.UserContextHolder;
import com.cajachambala.shared.infrastructure.persistence.CorrelativoService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/institucional")
@PreAuthorize("hasRole('ADMIN')")
public class RegistroInstitucionalController {
    private static final Set<String> CATEGORIAS = Set.of("empresa", "actas", "accionistas");
    private final RegistroInstitucionalService service;
    private final CorrelativoService correlativos;

    public RegistroInstitucionalController(RegistroInstitucionalService service, CorrelativoService correlativos) {
        this.service = service;
        this.correlativos = correlativos;
    }

    @GetMapping("/{categoria}")
    public List<JsonNode> listar(@PathVariable String categoria) {
        return service.listar(cajaId(), validarCategoria(categoria));
    }

    @GetMapping("/{categoria}/{id}")
    public ResponseEntity<JsonNode> obtener(@PathVariable String categoria, @PathVariable String id) {
        JsonNode data = service.obtener(cajaId(), validarCategoria(categoria), id);
        return data == null ? ResponseEntity.notFound().build() : ResponseEntity.ok(data);
    }

    @PostMapping("/{categoria}")
    public ResponseEntity<JsonNode> crear(@PathVariable String categoria, @RequestBody ObjectNode payload) {
        String tipo = validarCategoria(categoria);
        String id = payload.path("id").asText("");
        if (id.isBlank()) id = tipo.substring(0, Math.min(3, tipo.length())) + "-" + UUID.randomUUID();
        payload.put("id", id);
        if ("accionistas".equals(tipo) && !payload.hasNonNull("codigo")) {
            payload.put("codigo", service.siguienteCodigoAccionista(cajaId(), correlativos));
        }
        if ("empresa".equals(tipo)) payload.put("updatedAt", Instant.now().toString());
        return ResponseEntity.status(HttpStatus.CREATED).body(service.guardar(cajaId(), tipo, id, payload));
    }

    @PutMapping("/{categoria}/{id}")
    public JsonNode actualizar(@PathVariable String categoria, @PathVariable String id, @RequestBody ObjectNode payload) {
        String tipo = validarCategoria(categoria);
        payload.put("id", id.equals("empresa") ? payload.path("id").asText(id) : id);
        if ("empresa".equals(tipo)) payload.put("updatedAt", Instant.now().toString());
        return service.guardar(cajaId(), tipo, id, payload);
    }

    @DeleteMapping("/{categoria}/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable String categoria, @PathVariable String id) {
        return service.eliminar(cajaId(), validarCategoria(categoria), id)
                ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }

    private String validarCategoria(String categoria) {
        if (!CATEGORIAS.contains(categoria)) throw new IllegalArgumentException("Categoría institucional no permitida");
        return categoria;
    }

    private UUID cajaId() {
        UserContext context = UserContextHolder.getContext();
        if (context == null || !context.isAdmin()) throw new org.springframework.security.access.AccessDeniedException("Acceso denegado");
        return context.cajaId();
    }
}
