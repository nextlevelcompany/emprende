package com.cajachambala.utilidades.application;

import com.cajachambala.caja.domain.*;
import com.cajachambala.caja.infrastructure.persistence.ConceptoRepository;
import com.cajachambala.caja.infrastructure.persistence.OperacionRepository;
import com.cajachambala.caja.infrastructure.persistence.PeriodoRepository;
import com.cajachambala.identidad.domain.UserRole;
import com.cajachambala.identidad.infrastructure.audit.AuditService;
import com.cajachambala.shared.infrastructure.security.UserContext;
import com.cajachambala.shared.infrastructure.security.UserContextHolder;
import com.cajachambala.socios.domain.Socio;
import com.cajachambala.socios.domain.SocioEstado;
import com.cajachambala.socios.infrastructure.persistence.SocioRepository;
import com.cajachambala.utilidades.application.dto.UtilidadDtos.*;
import com.cajachambala.utilidades.domain.DistribucionEstado;
import com.cajachambala.utilidades.domain.DistribucionUtilidad;
import com.cajachambala.utilidades.domain.DistribucionUtilidadDetalle;
import com.cajachambala.utilidades.infrastructure.persistence.DistribucionUtilidadDetalleRepository;
import com.cajachambala.utilidades.infrastructure.persistence.DistribucionUtilidadRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DistribucionUtilidadService {

    private final DistribucionUtilidadRepository distribucionRepository;
    private final DistribucionUtilidadDetalleRepository detalleRepository;
    private final SocioRepository socioRepository;
    private final PeriodoRepository periodoRepository;
    private final ConceptoRepository conceptoRepository;
    private final OperacionRepository operacionRepository;
    private final AuditService auditService;

    public DistribucionUtilidadService(
            DistribucionUtilidadRepository distribucionRepository,
            DistribucionUtilidadDetalleRepository detalleRepository,
            SocioRepository socioRepository,
            PeriodoRepository periodoRepository,
            ConceptoRepository conceptoRepository,
            OperacionRepository operacionRepository,
            AuditService auditService
    ) {
        this.distribucionRepository = distribucionRepository;
        this.detalleRepository = detalleRepository;
        this.socioRepository = socioRepository;
        this.periodoRepository = periodoRepository;
        this.conceptoRepository = conceptoRepository;
        this.operacionRepository = operacionRepository;
        this.auditService = auditService;
    }

    // ==========================================
    // 1. Resumen y Cómputo del Ejercicio
    // ==========================================

    @Transactional(readOnly = true)
    public ResumenEjercicioResponse obtenerResumenEjercicio(Short ejercicio) {
        UUID cajaId = getCajaIdActual();

        List<Periodo> periodosAnio = periodoRepository.findByCajaIdOrderByAnioDescMesDesc(cajaId).stream()
                .filter(p -> Objects.equals(p.getAnio(), ejercicio))
                .toList();

        BigDecimal totalIngresos = BigDecimal.ZERO;
        BigDecimal totalEgresos = BigDecimal.ZERO;

        for (Periodo p : periodosAnio) {
            List<Operacion> ops = operacionRepository.findByCajaIdAndPeriodoIdAndEstadoOrderByFechaAscNroReciboAsc(cajaId, p.getId(), OperacionEstado.VIGENTE);
            for (Operacion op : ops) {
                if (op.getTipo() == FlujoTipo.INGRESO) {
                    totalIngresos = totalIngresos.add(op.getTotal());
                } else if (op.getTipo() == FlujoTipo.EGRESO) {
                    totalEgresos = totalEgresos.add(op.getTotal());
                }
            }
        }

        BigDecimal utilidadNeta = totalIngresos.subtract(totalEgresos).max(BigDecimal.ZERO);
        List<Socio> sociosActivos = socioRepository.findByCajaIdAndEstadoAndDeletedAtIsNullOrderByCodigoAsc(cajaId, SocioEstado.ACTIVO);

        // Estimar acciones históricas o base (mínimo 1 acción por socio, ej. S/. 30)
        int totalAcciones = sociosActivos.size() * 10; // estimación base por defecto si no hay asamblea

        return new ResumenEjercicioResponse(
                ejercicio,
                totalIngresos.setScale(2, RoundingMode.HALF_UP),
                totalEgresos.setScale(2, RoundingMode.HALF_UP),
                utilidadNeta.setScale(2, RoundingMode.HALF_UP),
                sociosActivos.size(),
                totalAcciones,
                new BigDecimal("30.00")
        );
    }

    // ==========================================
    // 2. Simulación Proforma de Reparto
    // ==========================================

    @Transactional(readOnly = true)
    public DistribucionResponse simular(SimularDistribucionRequest req) {
        UUID cajaId = getCajaIdActual();
        LocalDate corte = req.fechaCorte() != null ? req.fechaCorte() : LocalDate.of(req.ejercicio(), 12, 31);
        BigDecimal utilidad = req.utilidadTotal().setScale(2, RoundingMode.HALF_UP);

        Map<UUID, Integer> mapaAcciones = obtenerOMapearAcciones(cajaId, req.sociosManuales());
        int totalAcciones = mapaAcciones.values().stream().mapToInt(Integer::intValue).sum();

        if (totalAcciones <= 0) {
            throw new IllegalArgumentException("El número total de acciones debe ser mayor a 0");
        }

        BigDecimal valorPorAccion = utilidad.divide(BigDecimal.valueOf(totalAcciones), 6, RoundingMode.HALF_UP);

        List<Socio> socios = socioRepository.findAllById(mapaAcciones.keySet());
        Map<UUID, Socio> sociosMap = socios.stream().collect(Collectors.toMap(Socio::getId, s -> s));

        List<DetalleDistribucionResponse> detalles = calcularRenglonesConAjuste(
                mapaAcciones,
                sociosMap,
                utilidad,
                totalAcciones,
                valorPorAccion,
                null
        );

        return new DistribucionResponse(
                null,
                cajaId,
                req.ejercicio(),
                corte,
                utilidad,
                totalAcciones,
                valorPorAccion,
                DistribucionEstado.BORRADOR,
                detalles,
                null,
                null
        );
    }

    // ==========================================
    // 3. Guardar Borrador
    // ==========================================

    @Transactional
    public DistribucionResponse guardarBorrador(GuardarDistribucionRequest req) {
        UUID cajaId = getCajaIdActual();
        UUID userId = getUserIdActual();

        Optional<DistribucionUtilidad> existente = distribucionRepository.findByCajaIdAndEjercicio(cajaId, req.ejercicio());
        if (existente.isPresent() && existente.get().getEstado() != DistribucionEstado.BORRADOR) {
            throw new IllegalStateException("El ejercicio " + req.ejercicio() + " ya cuenta con una distribución en estado " + existente.get().getEstado());
        }

        Map<UUID, Integer> mapaAcciones = req.socios().stream()
                .collect(Collectors.toMap(SocioAccionesInput::socioId, SocioAccionesInput::acciones));

        int totalAcciones = mapaAcciones.values().stream().mapToInt(Integer::intValue).sum();
        if (totalAcciones <= 0) {
            throw new IllegalArgumentException("El total de acciones asignadas debe ser mayor a 0");
        }

        BigDecimal utilidad = req.utilidadTotal().setScale(2, RoundingMode.HALF_UP);
        BigDecimal valorPorAccion = utilidad.divide(BigDecimal.valueOf(totalAcciones), 6, RoundingMode.HALF_UP);

        DistribucionUtilidad entidad = existente.orElseGet(() ->
                new DistribucionUtilidad(cajaId, req.ejercicio(), req.fechaCorte(), utilidad, totalAcciones)
        );

        entidad.actualizar(utilidad, totalAcciones, req.fechaCorte());
        entidad.limpiarDetalles();
        distribucionRepository.saveAndFlush(entidad);

        // Calcular montos individuales
        List<Socio> socios = socioRepository.findAllById(mapaAcciones.keySet());
        Map<UUID, Socio> sociosMap = socios.stream().collect(Collectors.toMap(Socio::getId, s -> s));

        List<DetalleDistribucionResponse> calculados = calcularRenglonesConAjuste(
                mapaAcciones,
                sociosMap,
                utilidad,
                totalAcciones,
                valorPorAccion,
                null
        );

        for (DetalleDistribucionResponse d : calculados) {
            DistribucionUtilidadDetalle det = new DistribucionUtilidadDetalle(
                    entidad.getId(),
                    d.socioId(),
                    d.acciones(),
                    d.monto()
            );
            entidad.agregarDetalle(det);
        }

        DistribucionUtilidad guardada = distribucionRepository.save(entidad);

        auditService.registrar(
                cajaId,
                userId,
                UserRole.ADMIN,
                "DISTRIBUCION_BORRADOR_GUARDADO",
                "distribucion_utilidad",
                guardada.getId(),
                null,
                Map.of("ejercicio", guardada.getEjercicio().toString(), "utilidad", guardada.getUtilidadTotal().toString()),
                "127.0.0.1",
                "Internal"
        );

        return toDistribucionResponse(guardada, sociosMap);
    }

    // ==========================================
    // 4. Aprobación y Pago
    // ==========================================

    @Transactional
    public DistribucionResponse aprobar(UUID id) {
        UUID cajaId = getCajaIdActual();
        UUID userId = getUserIdActual();

        DistribucionUtilidad dist = distribucionRepository.findByIdAndCajaId(id, cajaId)
                .orElseThrow(() -> new IllegalArgumentException("Distribución no encontrada"));

        dist.aprobar(userId);
        DistribucionUtilidad guardada = distribucionRepository.save(dist);

        Map<UUID, Socio> sociosMap = cargarSociosMap(guardada);

        auditService.registrar(
                cajaId,
                userId,
                UserRole.ADMIN,
                "DISTRIBUCION_APROBADA",
                "distribucion_utilidad",
                guardada.getId(),
                null,
                Map.of("ejercicio", guardada.getEjercicio().toString()),
                "127.0.0.1",
                "Internal"
        );

        return toDistribucionResponse(guardada, sociosMap);
    }

    @Transactional
    public DistribucionResponse pagar(UUID id, PagarDistribucionRequest req) {
        UUID cajaId = getCajaIdActual();
        UUID userId = getUserIdActual();

        DistribucionUtilidad dist = distribucionRepository.findByIdAndCajaId(id, cajaId)
                .orElseThrow(() -> new IllegalArgumentException("Distribución no encontrada"));

        if (dist.getEstado() != DistribucionEstado.APROBADA) {
            throw new IllegalStateException("La distribución debe estar en estado APROBADA para poder registrar los pagos");
        }

        Periodo periodo = periodoRepository.findByIdAndCajaId(req.periodoId(), cajaId)
                .orElseThrow(() -> new IllegalArgumentException("Periodo contable no encontrado"));

        if (periodo.getEstado() == PeriodoEstado.CERRADO) {
            throw new IllegalStateException("El periodo contable seleccionado está cerrado: no se permiten egresos");
        }

        Concepto conceptoUtilidad = conceptoRepository.findByCodigo("UTILIDAD_DISTRIBUIDA")
                .orElseThrow(() -> new IllegalStateException("Concepto 'UTILIDAD_DISTRIBUIDA' no configurado"));

        Map<UUID, Socio> sociosMap = cargarSociosMap(dist);
        LocalDate fechaOperacion = req.fechaPago() != null ? req.fechaPago() : periodo.getFechaReunion();

        for (DistribucionUtilidadDetalle det : dist.getDetalles()) {
            if (det.getMonto().compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }

            Socio socio = sociosMap.get(det.getSocioId());
            String desc = "Pago utilidades ejercicio " + dist.getEjercicio() + " - " +
                    (socio != null ? socio.getNombreCompleto() : "Socio #" + det.getSocioId()) +
                    " (" + det.getAcciones() + " acciones)";

            Operacion egreso = new Operacion(
                    cajaId,
                    periodo.getId(),
                    det.getSocioId(),
                    FlujoTipo.EGRESO,
                    fechaOperacion,
                    null,
                    desc,
                    userId
            );

            egreso.agregarDetalle(
                    conceptoUtilidad.getId(),
                    det.getMonto(),
                    null,
                    null
            );

            Operacion guardadaOp = operacionRepository.save(egreso);
            det.registrarPagoOperacion(guardadaOp.getId());
        }

        dist.marcarPagada();
        DistribucionUtilidad guardada = distribucionRepository.save(dist);

        auditService.registrar(
                cajaId,
                userId,
                UserRole.ADMIN,
                "DISTRIBUCION_PAGADA",
                "distribucion_utilidad",
                guardada.getId(),
                null,
                Map.of("ejercicio", guardada.getEjercicio().toString(), "periodoId", periodo.getId().toString()),
                "127.0.0.1",
                "Internal"
        );

        return toDistribucionResponse(guardada, sociosMap);
    }

    // ==========================================
    // 5. Consultas
    // ==========================================

    @Transactional(readOnly = true)
    public DistribucionResponse obtener(UUID id) {
        UUID cajaId = getCajaIdActual();
        DistribucionUtilidad dist = distribucionRepository.findByIdAndCajaId(id, cajaId)
                .orElseThrow(() -> new IllegalArgumentException("Distribución no encontrada"));

        Map<UUID, Socio> sociosMap = cargarSociosMap(dist);
        return toDistribucionResponse(dist, sociosMap);
    }

    @Transactional(readOnly = true)
    public List<DistribucionResponse> listar() {
        UUID cajaId = getCajaIdActual();
        List<DistribucionUtilidad> lista = distribucionRepository.findByCajaIdOrderByEjercicioDesc(cajaId);

        return lista.stream().map(d -> {
            Map<UUID, Socio> sociosMap = cargarSociosMap(d);
            return toDistribucionResponse(d, sociosMap);
        }).toList();
    }

    // ==========================================
    // Métodos Auxiliares
    // ==========================================

    private Map<UUID, Integer> obtenerOMapearAcciones(UUID cajaId, List<SocioAccionesInput> manuales) {
        if (manuales != null && !manuales.isEmpty()) {
            return manuales.stream()
                    .filter(s -> s.acciones() > 0)
                    .collect(Collectors.toMap(SocioAccionesInput::socioId, SocioAccionesInput::acciones));
        }

        // Asignación equitativa por defecto entre socios activos (ej: 10 acciones cada uno)
        List<Socio> socios = socioRepository.findByCajaIdAndEstadoAndDeletedAtIsNullOrderByCodigoAsc(cajaId, SocioEstado.ACTIVO);
        Map<UUID, Integer> map = new LinkedHashMap<>();
        for (Socio s : socios) {
            map.put(s.getId(), 10);
        }
        return map;
    }

    private List<DetalleDistribucionResponse> calcularRenglonesConAjuste(
            Map<UUID, Integer> mapaAcciones,
            Map<UUID, Socio> sociosMap,
            BigDecimal utilidadTotal,
            int totalAcciones,
            BigDecimal valorPorAccion,
            Map<UUID, UUID> operacionesMap
    ) {
        List<DetalleDistribucionResponse> resultado = new ArrayList<>();
        List<Map.Entry<UUID, Integer>> lista = new ArrayList<>(mapaAcciones.entrySet());
        lista.sort(Comparator.comparing(e -> sociosMap.get(e.getKey()) != null ? sociosMap.get(e.getKey()).getCodigo() : 9999));

        BigDecimal sumaMontos = BigDecimal.ZERO;

        for (int i = 0; i < lista.size(); i++) {
            Map.Entry<UUID, Integer> entry = lista.get(i);
            UUID socioId = entry.getKey();
            int acc = entry.getValue();

            BigDecimal monto;
            if (i == lista.size() - 1) {
                // Ajuste exacto al centavo en la última fila
                monto = utilidadTotal.subtract(sumaMontos).setScale(2, RoundingMode.HALF_UP);
            } else {
                monto = BigDecimal.valueOf(acc).multiply(valorPorAccion).setScale(2, RoundingMode.HALF_UP);
            }
            sumaMontos = sumaMontos.add(monto);

            BigDecimal porcentaje = BigDecimal.valueOf(acc * 100L)
                    .divide(BigDecimal.valueOf(totalAcciones), 2, RoundingMode.HALF_UP);

            Socio s = sociosMap.get(socioId);
            UUID opId = operacionesMap != null ? operacionesMap.get(socioId) : null;

            resultado.add(new DetalleDistribucionResponse(
                    socioId,
                    s != null ? s.getCodigo() : null,
                    s != null ? s.getNombreCompleto() : "Socio #" + socioId,
                    s != null ? s.getDocumentoTipo() : "-",
                    acc,
                    porcentaje,
                    monto,
                    opId
            ));
        }

        return resultado;
    }

    private Map<UUID, Socio> cargarSociosMap(DistribucionUtilidad dist) {
        Set<UUID> ids = dist.getDetalles().stream().map(DistribucionUtilidadDetalle::getSocioId).collect(Collectors.toSet());
        return socioRepository.findAllById(ids).stream().collect(Collectors.toMap(Socio::getId, s -> s));
    }

    private DistribucionResponse toDistribucionResponse(DistribucionUtilidad d, Map<UUID, Socio> sociosMap) {
        Map<UUID, UUID> opsMap = d.getDetalles().stream()
                .filter(det -> det.getOperacionId() != null)
                .collect(Collectors.toMap(DistribucionUtilidadDetalle::getSocioId, DistribucionUtilidadDetalle::getOperacionId));

        Map<UUID, Integer> accMap = d.getDetalles().stream()
                .collect(Collectors.toMap(DistribucionUtilidadDetalle::getSocioId, DistribucionUtilidadDetalle::getAcciones));

        List<DetalleDistribucionResponse> detalles = calcularRenglonesConAjuste(
                accMap,
                sociosMap,
                d.getUtilidadTotal(),
                d.getTotalAcciones(),
                d.getValorPorAccion(),
                opsMap
        );

        return new DistribucionResponse(
                d.getId(),
                d.getCajaId(),
                d.getEjercicio(),
                d.getFechaCorte(),
                d.getUtilidadTotal(),
                d.getTotalAcciones(),
                d.getValorPorAccion(),
                d.getEstado(),
                detalles,
                d.getCreatedAt(),
                d.getUpdatedAt()
        );
    }

    private UUID getCajaIdActual() {
        UserContext ctx = UserContextHolder.getContext();
        return (ctx != null && ctx.cajaId() != null) ? ctx.cajaId() : UUID.fromString("a0000000-0000-0000-0000-000000000001");
    }

    private UUID getUserIdActual() {
        UserContext ctx = UserContextHolder.getContext();
        return (ctx != null && ctx.userId() != null) ? ctx.userId() : null;
    }
}
