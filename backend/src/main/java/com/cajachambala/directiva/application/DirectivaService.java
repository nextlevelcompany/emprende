package com.cajachambala.directiva.application;

import com.cajachambala.directiva.application.dto.DirectivaDtos.*;
import com.cajachambala.directiva.domain.DirectivaCargo;
import com.cajachambala.directiva.infrastructure.persistence.DirectivaCargoRepository;
import com.cajachambala.identidad.domain.UserRole;
import com.cajachambala.identidad.infrastructure.audit.AuditService;
import com.cajachambala.shared.infrastructure.security.UserContext;
import com.cajachambala.shared.infrastructure.security.UserContextHolder;
import com.cajachambala.socios.domain.Socio;
import com.cajachambala.socios.infrastructure.persistence.SocioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class DirectivaService {

    private final DirectivaCargoRepository directivaRepository;
    private final SocioRepository socioRepository;
    private final AuditService auditService;

    public DirectivaService(
            DirectivaCargoRepository directivaRepository,
            SocioRepository socioRepository,
            AuditService auditService
    ) {
        this.directivaRepository = directivaRepository;
        this.socioRepository = socioRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<DirectivaCargoDto> listarCargos() {
        UUID cajaId = getCajaIdActual();
        return directivaRepository.findByCajaIdOrderByOrdenAsc(cajaId).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DirectivaCargoDto> listarCargosActivos() {
        UUID cajaId = getCajaIdActual();
        return directivaRepository.findByCajaIdAndActivoTrueOrderByOrdenAsc(cajaId).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public List<DirectivaCargoDto> guardarDirectiva(GuardarDirectivaRequest req) {
        UUID cajaId = getCajaIdActual();
        UUID userId = getUserIdActual();

        List<DirectivaCargo> resultado = new ArrayList<>();
        short indexOrden = 1;

        for (GuardarCargoItemRequest item : req.cargos()) {
            Socio socio = null;
            if (item.socioId() != null) {
                socio = socioRepository.findByIdAndCajaId(item.socioId(), cajaId).orElse(null);
            }

            short orden = item.orden() != null ? item.orden() : indexOrden++;
            boolean activo = item.activo() != null ? item.activo() : true;

            DirectivaCargo cargoEntidad;
            if (item.id() != null) {
                cargoEntidad = directivaRepository.findByIdAndCajaId(item.id(), cajaId)
                        .orElseGet(() -> new DirectivaCargo(
                                item.id(),
                                cajaId,
                                item.cargo(),
                                item.cargoTitulo(),
                                null,
                                item.nombreCompleto(),
                                item.tipoDocumento(),
                                item.numeroDocumento(),
                                item.telefono(),
                                item.email(),
                                item.periodoInicio(),
                                item.periodoFin(),
                                activo,
                                orden,
                                item.observaciones(),
                                userId
                        ));

                cargoEntidad.actualizar(
                        item.cargo(),
                        item.cargoTitulo(),
                        socio,
                        item.nombreCompleto(),
                        item.tipoDocumento(),
                        item.numeroDocumento(),
                        item.telefono(),
                        item.email(),
                        item.periodoInicio(),
                        item.periodoFin(),
                        activo,
                        orden,
                        item.observaciones()
                );
            } else {
                cargoEntidad = new DirectivaCargo(
                        UUID.randomUUID(),
                        cajaId,
                        item.cargo(),
                        item.cargoTitulo(),
                        socio,
                        item.nombreCompleto(),
                        item.tipoDocumento(),
                        item.numeroDocumento(),
                        item.telefono(),
                        item.email(),
                        item.periodoInicio(),
                        item.periodoFin(),
                        activo,
                        orden,
                        item.observaciones(),
                        userId
                );
            }

            resultado.add(directivaRepository.save(cargoEntidad));
        }

        auditService.registrar(
                cajaId,
                userId,
                UserRole.ADMIN,
                "DIRECTIVA_ACTUALIZADA",
                "junta_directiva",
                cajaId,
                null,
                Map.of("totalCargos", resultado.size()),
                "127.0.0.1",
                "Internal"
        );

        return resultado.stream()
                .sorted(Comparator.comparing(DirectivaCargo::getOrden))
                .map(this::toDto)
                .toList();
    }

    private DirectivaCargoDto toDto(DirectivaCargo c) {
        return new DirectivaCargoDto(
                c.getId(),
                c.getCargo(),
                c.getCargoTitulo(),
                c.getSocio() != null ? c.getSocio().getId() : null,
                c.getSocio() != null ? c.getSocio().getCodigo() : null,
                c.getNombreCompleto(),
                c.getTipoDocumento(),
                c.getNumeroDocumento(),
                c.getTelefono(),
                c.getEmail(),
                c.getPeriodoInicio(),
                c.getPeriodoFin(),
                c.isActivo(),
                c.getOrden(),
                c.getObservaciones()
        );
    }

    private UUID getCajaIdActual() {
        UserContext ctx = UserContextHolder.getContext();
        return (ctx != null && ctx.cajaId() != null) ? ctx.cajaId() : UUID.fromString("a0000000-0000-0000-0000-000000000001");
    }

    private UUID getUserIdActual() {
        UserContext ctx = UserContextHolder.getContext();
        return (ctx != null) ? ctx.userId() : null;
    }
}
