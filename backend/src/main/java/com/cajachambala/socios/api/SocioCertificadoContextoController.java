package com.cajachambala.socios.api;

import com.cajachambala.directiva.application.DirectivaService;
import com.cajachambala.directiva.application.dto.DirectivaDtos.DirectivaCargoDto;
import com.cajachambala.shared.application.RegistroInstitucionalService;
import com.cajachambala.shared.infrastructure.security.UserContext;
import com.cajachambala.shared.infrastructure.security.UserContextHolder;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/socios/me/certificado-contexto")
@PreAuthorize("hasRole('SOCIO')")
public class SocioCertificadoContextoController {

    private static final Set<String> EMPRESA_FIELDS = Set.of(
            "nombre", "nombreComercial", "ruc", "fechaFundacion", "fechaEmisionAcciones",
            "distrito", "provincia", "departamento", "pais"
    );

    private final DirectivaService directivaService;
    private final RegistroInstitucionalService registros;

    public SocioCertificadoContextoController(
            DirectivaService directivaService,
            RegistroInstitucionalService registros
    ) {
        this.directivaService = directivaService;
        this.registros = registros;
    }

    @GetMapping
    public Map<String, Object> obtenerContextoCertificado() {
        UserContext context = UserContextHolder.getContext();
        if (context == null || context.socioId() == null || context.cajaId() == null) {
            throw new AccessDeniedException("La cuenta no está asociada a un socio");
        }

        JsonNode registroEmpresa = registros.obtener(context.cajaId(), "empresa", "empresa");
        Map<String, Object> empresa = new LinkedHashMap<>();
        if (registroEmpresa != null && registroEmpresa.isObject()) {
            EMPRESA_FIELDS.forEach(field -> {
                JsonNode value = registroEmpresa.get(field);
                if (value != null && !value.isNull()) empresa.put(field, value);
            });
        }

        List<Map<String, Object>> cargos = directivaService.listarCargosActivos().stream()
                .map(this::datosFirma)
                .toList();

        return Map.of("directiva", cargos, "empresa", empresa);
    }

    private Map<String, Object> datosFirma(DirectivaCargoDto cargo) {
        Map<String, Object> firma = new LinkedHashMap<>();
        firma.put("cargo", cargo.cargo());
        firma.put("cargoTitulo", cargo.cargoTitulo());
        firma.put("nombreCompleto", cargo.nombreCompleto());
        firma.put("tipoDocumento", cargo.tipoDocumento());
        firma.put("numeroDocumento", cargo.numeroDocumento());
        firma.put("activo", cargo.activo());
        return firma;
    }
}
