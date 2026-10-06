package com.cajachambala.caja.application;

import com.cajachambala.caja.application.dto.CajaDtos.*;
import com.cajachambala.caja.domain.*;
import com.cajachambala.caja.infrastructure.persistence.*;
import com.cajachambala.identidad.domain.UserRole;
import com.cajachambala.identidad.infrastructure.audit.AuditService;
import com.cajachambala.shared.infrastructure.security.UserContext;
import com.cajachambala.shared.infrastructure.security.UserContextHolder;
import com.cajachambala.socios.domain.Socio;
import com.cajachambala.socios.domain.SocioEstado;
import com.cajachambala.socios.infrastructure.persistence.SocioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class CajaService {

    private final PeriodoRepository periodoRepository;
    private final ConceptoRepository conceptoRepository;
    private final OperacionRepository operacionRepository;
    private final CierrePeriodoRepository cierrePeriodoRepository;
    private final ArqueoCajaRepository arqueoCajaRepository;
    private final SocioRepository socioRepository;
    private final AuditService auditService;

    public CajaService(
            PeriodoRepository periodoRepository,
            ConceptoRepository conceptoRepository,
            OperacionRepository operacionRepository,
            CierrePeriodoRepository cierrePeriodoRepository,
            ArqueoCajaRepository arqueoCajaRepository,
            SocioRepository socioRepository,
            AuditService auditService
    ) {
        this.periodoRepository = periodoRepository;
        this.conceptoRepository = conceptoRepository;
        this.operacionRepository = operacionRepository;
        this.cierrePeriodoRepository = cierrePeriodoRepository;
        this.arqueoCajaRepository = arqueoCajaRepository;
        this.socioRepository = socioRepository;
        this.auditService = auditService;
    }

    // ==========================================
    // 1. Periodos
    // ==========================================

    @Transactional
    public PeriodoResponse crearPeriodo(CrearPeriodoRequest req) {
        UUID cajaId = getCajaIdActual();
        UUID userId = getUserIdActual();

        if (req.anio() < 2020 || req.anio() > 2100) {
            throw new IllegalArgumentException("Año inválido (debe ser entre 2020 y 2100)");
        }
        if (req.mes() < 1 || req.mes() > 12) {
            throw new IllegalArgumentException("Mes inválido (debe ser entre 1 y 12)");
        }

        if (periodoRepository.findByCajaIdAndAnioAndMes(cajaId, req.anio(), req.mes()).isPresent()) {
            throw new IllegalArgumentException("Ya existe un periodo para el año " + req.anio() + " y mes " + req.mes());
        }

        LocalDate fechaReunion = req.fechaReunion();
        if (fechaReunion == null) {
            int maxDay = YearMonth.of(req.anio(), req.mes()).lengthOfMonth();
            fechaReunion = LocalDate.of(req.anio(), req.mes(), Math.min(8, maxDay));
        } else {
            if (fechaReunion.getYear() != req.anio() || fechaReunion.getMonthValue() != req.mes()) {
                throw new IllegalArgumentException("La fecha de reunión debe coincidir con el año y mes del periodo");
            }
        }

        Periodo periodo = new Periodo(cajaId, req.anio(), req.mes(), fechaReunion);
        Periodo guardado = periodoRepository.save(periodo);

        auditService.registrar(
                cajaId,
                userId,
                UserRole.ADMIN,
                "PERIODO_CREADO",
                "periodo",
                guardado.getId(),
                null,
                Map.of("anio", guardado.getAnio(), "mes", guardado.getMes(), "fechaReunion", guardado.getFechaReunion().toString()),
                "127.0.0.1",
                "Internal"
        );

        BigDecimal saldoAnt = calcularSaldoAnterior(cajaId, guardado.getAnio(), guardado.getMes());
        return toPeriodoResponse(guardado, saldoAnt, BigDecimal.ZERO, BigDecimal.ZERO, saldoAnt);
    }

    @Transactional(readOnly = true)
    public List<PeriodoResponse> listarPeriodos() {
        UUID cajaId = getCajaIdActual();
        List<Periodo> periodos = periodoRepository.findByCajaIdOrderByAnioDescMesDesc(cajaId);

        return periodos.stream().map(p -> {
            if (p.getEstado() == PeriodoEstado.CERRADO) {
                Optional<CierrePeriodo> cierreOpt = cierrePeriodoRepository.findById(p.getId());
                if (cierreOpt.isPresent()) {
                    CierrePeriodo c = cierreOpt.get();
                    return toPeriodoResponse(p, c.getSaldoAnterior(), c.getTotalIngresos(), c.getTotalEgresos(), c.getSaldoFinal());
                }
            }

            // Periodo abierto: calcular en vivo
            BigDecimal saldoAnt = calcularSaldoAnterior(cajaId, p.getAnio(), p.getMes());
            List<Operacion> vigentes = operacionRepository.findByCajaIdAndPeriodoIdAndEstadoOrderByFechaAscNroReciboAsc(
                    cajaId, p.getId(), OperacionEstado.VIGENTE);

            BigDecimal ingresos = vigentes.stream()
                    .filter(o -> o.getTipo() == FlujoTipo.INGRESO)
                    .map(Operacion::getTotal)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal egresos = vigentes.stream()
                    .filter(o -> o.getTipo() == FlujoTipo.EGRESO)
                    .map(Operacion::getTotal)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal saldoFin = saldoAnt.add(ingresos).subtract(egresos);
            return toPeriodoResponse(p, saldoAnt, ingresos, egresos, saldoFin);
        }).toList();
    }

    @Transactional(readOnly = true)
    public PeriodoResponse obtenerPeriodo(UUID id) {
        UUID cajaId = getCajaIdActual();
        Periodo p = periodoRepository.findByIdAndCajaId(id, cajaId)
                .orElseThrow(() -> new IllegalArgumentException("Periodo no encontrado"));

        if (p.getEstado() == PeriodoEstado.CERRADO) {
            Optional<CierrePeriodo> cierreOpt = cierrePeriodoRepository.findById(p.getId());
            if (cierreOpt.isPresent()) {
                CierrePeriodo c = cierreOpt.get();
                return toPeriodoResponse(p, c.getSaldoAnterior(), c.getTotalIngresos(), c.getTotalEgresos(), c.getSaldoFinal());
            }
        }

        BigDecimal saldoAnt = calcularSaldoAnterior(cajaId, p.getAnio(), p.getMes());
        List<Operacion> vigentes = operacionRepository.findByCajaIdAndPeriodoIdAndEstadoOrderByFechaAscNroReciboAsc(
                cajaId, p.getId(), OperacionEstado.VIGENTE);

        BigDecimal ingresos = vigentes.stream()
                .filter(o -> o.getTipo() == FlujoTipo.INGRESO)
                .map(Operacion::getTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal egresos = vigentes.stream()
                .filter(o -> o.getTipo() == FlujoTipo.EGRESO)
                .map(Operacion::getTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal saldoFin = saldoAnt.add(ingresos).subtract(egresos);
        return toPeriodoResponse(p, saldoAnt, ingresos, egresos, saldoFin);
    }

    @Transactional(readOnly = true)
    public PeriodoResponse obtenerPeriodoAbiertoActual() {
        UUID cajaId = getCajaIdActual();
        Periodo p = periodoRepository.findFirstByCajaIdAndEstadoOrderByAnioDescMesDesc(cajaId, PeriodoEstado.ABIERTO)
                .orElseThrow(() -> new IllegalArgumentException("No hay ningún periodo contable abierto"));
        return obtenerPeriodo(p.getId());
    }

    // ==========================================
    // 2. Operaciones
    // ==========================================

    @Transactional
    public OperacionResponse registrarOperacion(UUID periodoId, RegistrarOperacionRequest req) {
        UUID cajaId = getCajaIdActual();
        UUID userId = getUserIdActual();

        Periodo periodo = periodoRepository.findByIdAndCajaId(periodoId, cajaId)
                .orElseThrow(() -> new IllegalArgumentException("Periodo no encontrado"));

        if (periodo.getEstado() == PeriodoEstado.CERRADO) {
            throw new IllegalStateException("El periodo está cerrado: no se permiten cambios");
        }

        if (req.detalles() == null || req.detalles().isEmpty()) {
            throw new IllegalArgumentException("Debe incluir al menos un concepto en la operación");
        }

        // Validar socio
        Socio socio = null;
        if (req.socioId() != null) {
            socio = socioRepository.findByIdAndCajaId(req.socioId(), cajaId)
                    .orElseThrow(() -> new IllegalArgumentException("Socio no encontrado"));
        }

        // Validar conceptos
        for (DetalleOperacionRequest d : req.detalles()) {
            Concepto concepto = conceptoRepository.findById(d.conceptoId())
                    .orElseThrow(() -> new IllegalArgumentException("Concepto con ID " + d.conceptoId() + " no encontrado"));

            if (!concepto.isActivo()) {
                throw new IllegalArgumentException("El concepto '" + concepto.getNombre() + "' no se encuentra activo");
            }

            if (concepto.getTipo() != req.tipo()) {
                throw new IllegalArgumentException("El concepto '" + concepto.getNombre() + "' (" + concepto.getTipo() +
                        ") no coincide con el tipo de operación (" + req.tipo() + ")");
            }

            if (concepto.isRequiereSocio() && req.socioId() == null) {
                throw new IllegalArgumentException("El concepto '" + concepto.getNombre() + "' requiere especificar un socio");
            }
        }

        // Numeración de recibo
        Integer nroRecibo = req.nroRecibo();
        if (nroRecibo == null && req.tipo() == FlujoTipo.INGRESO) {
            nroRecibo = operacionRepository.findMaxNroReciboByCajaId(cajaId) + 1;
        }

        LocalDate fechaOperacion = req.fecha() != null ? req.fecha() : periodo.getFechaReunion();

        Operacion operacion = new Operacion(
                cajaId,
                periodoId,
                req.socioId(),
                req.tipo(),
                fechaOperacion,
                nroRecibo,
                req.descripcion() != null ? req.descripcion().trim() : null,
                userId
        );

        for (DetalleOperacionRequest d : req.detalles()) {
            operacion.agregarDetalle(d.conceptoId(), d.monto(), d.prestamoId(), d.cuotaId());
        }

        Operacion guardada = operacionRepository.save(operacion);

        auditService.registrar(
                cajaId,
                userId,
                UserRole.ADMIN,
                "OPERACION_REGISTRADA",
                "operacion",
                guardada.getId(),
                null,
                Map.of("tipo", guardada.getTipo().name(), "total", guardada.getTotal().toString(), "nroRecibo", String.valueOf(guardada.getNroRecibo())),
                "127.0.0.1",
                "Internal"
        );

        return toOperacionResponse(guardada, socio);
    }

    @Transactional
    public OperacionResponse anularOperacion(UUID operacionId, AnularOperacionRequest req) {
        UUID cajaId = getCajaIdActual();
        UUID userId = getUserIdActual();

        Operacion operacion = operacionRepository.findByIdAndCajaId(operacionId, cajaId)
                .orElseThrow(() -> new IllegalArgumentException("Operación no encontrada"));

        Periodo periodo = periodoRepository.findByIdAndCajaId(operacion.getPeriodoId(), cajaId)
                .orElseThrow(() -> new IllegalArgumentException("Periodo no encontrado"));

        if (periodo.getEstado() == PeriodoEstado.CERRADO) {
            throw new IllegalStateException("El periodo está cerrado: no se permiten cambios");
        }

        operacion.anular(userId, req.motivo());
        Operacion guardada = operacionRepository.save(operacion);

        auditService.registrar(
                cajaId,
                userId,
                UserRole.ADMIN,
                "OPERACION_ANULADA",
                "operacion",
                guardada.getId(),
                null,
                Map.of("motivo", req.motivo(), "anuladoAt", guardada.getAnuladoAt().toString()),
                "127.0.0.1",
                "Internal"
        );

        Socio socio = null;
        if (guardada.getSocioId() != null) {
            socio = socioRepository.findByIdAndCajaId(guardada.getSocioId(), cajaId).orElse(null);
        }

        return toOperacionResponse(guardada, socio);
    }

    @Transactional(readOnly = true)
    public List<OperacionResponse> listarOperaciones(UUID periodoId, FlujoTipo tipo, OperacionEstado estado) {
        UUID cajaId = getCajaIdActual();
        List<Operacion> operaciones = operacionRepository.findByPeriodoIdOrderByFechaAscNroReciboAsc(periodoId);

        Map<UUID, Socio> socioMap = socioRepository.findByCajaIdAndDeletedAtIsNullOrderByCodigoAsc(cajaId).stream()
                .collect(Collectors.toMap(Socio::getId, s -> s));

        return operaciones.stream()
                .filter(o -> o.getCajaId().equals(cajaId))
                .filter(o -> tipo == null || o.getTipo() == tipo)
                .filter(o -> estado == null || o.getEstado() == estado)
                .map(o -> toOperacionResponse(o, o.getSocioId() != null ? socioMap.get(o.getSocioId()) : null))
                .toList();
    }

    // ==========================================
    // 3. Arqueo de Caja
    // ==========================================

    @Transactional
    public ArqueoResponse registrarArqueo(UUID periodoId, RegistrarArqueoRequest req) {
        UUID cajaId = getCajaIdActual();
        UUID userId = getUserIdActual();

        Periodo periodo = periodoRepository.findByIdAndCajaId(periodoId, cajaId)
                .orElseThrow(() -> new IllegalArgumentException("Periodo no encontrado"));

        BigDecimal saldoAnt = calcularSaldoAnterior(cajaId, periodo.getAnio(), periodo.getMes());
        List<Operacion> vigentes = operacionRepository.findByCajaIdAndPeriodoIdAndEstadoOrderByFechaAscNroReciboAsc(
                cajaId, periodoId, OperacionEstado.VIGENTE);

        BigDecimal ingresos = vigentes.stream()
                .filter(o -> o.getTipo() == FlujoTipo.INGRESO)
                .map(Operacion::getTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal egresos = vigentes.stream()
                .filter(o -> o.getTipo() == FlujoTipo.EGRESO)
                .map(Operacion::getTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal saldoSistema = saldoAnt.add(ingresos).subtract(egresos);

        Optional<ArqueoCaja> existenteOpt = arqueoCajaRepository.findById(periodoId);
        ArqueoCaja arqueo;
        if (existenteOpt.isPresent()) {
            arqueo = existenteOpt.get();
            arqueo.actualizar(req.efectivo(), req.depositosBancos(), saldoSistema, req.observacion());
        } else {
            arqueo = new ArqueoCaja(periodoId, req.efectivo(), req.depositosBancos(), saldoSistema, req.observacion(), userId);
        }

        ArqueoCaja guardado = arqueoCajaRepository.save(arqueo);

        auditService.registrar(
                cajaId,
                userId,
                UserRole.ADMIN,
                "ARQUEO_REGISTRADO",
                "arqueo_caja",
                guardado.getPeriodoId(),
                null,
                Map.of("totalContado", guardado.getTotalContado().toString(), "saldoSistema", saldoSistema.toString(), "diferencia", guardado.getDiferencia().toString()),
                "127.0.0.1",
                "Internal"
        );

        return toArqueoResponse(guardado);
    }

    @Transactional(readOnly = true)
    public ArqueoResponse obtenerArqueo(UUID periodoId) {
        UUID cajaId = getCajaIdActual();
        Periodo periodo = periodoRepository.findByIdAndCajaId(periodoId, cajaId)
                .orElseThrow(() -> new IllegalArgumentException("Periodo no encontrado"));

        Optional<ArqueoCaja> arqueoOpt = arqueoCajaRepository.findById(periodoId);
        if (arqueoOpt.isPresent()) {
            return toArqueoResponse(arqueoOpt.get());
        }

        // Si no existe, devolver cálculo de saldo sistema actual
        BigDecimal saldoAnt = calcularSaldoAnterior(cajaId, periodo.getAnio(), periodo.getMes());
        List<Operacion> vigentes = operacionRepository.findByCajaIdAndPeriodoIdAndEstadoOrderByFechaAscNroReciboAsc(
                cajaId, periodoId, OperacionEstado.VIGENTE);

        BigDecimal ingresos = vigentes.stream()
                .filter(o -> o.getTipo() == FlujoTipo.INGRESO)
                .map(Operacion::getTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal egresos = vigentes.stream()
                .filter(o -> o.getTipo() == FlujoTipo.EGRESO)
                .map(Operacion::getTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal saldoSistema = saldoAnt.add(ingresos).subtract(egresos);

        return new ArqueoResponse(
                periodoId,
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                saldoSistema,
                saldoSistema.negate(),
                "Pendiente de arqueo físico",
                null
        );
    }

    // ==========================================
    // 4. Cierre y Reapertura
    // ==========================================

    @Transactional
    public CierrePeriodoResponse cerrarPeriodo(UUID periodoId) {
        UUID cajaId = getCajaIdActual();
        UUID userId = getUserIdActual();

        Periodo periodo = periodoRepository.findByIdAndCajaId(periodoId, cajaId)
                .orElseThrow(() -> new IllegalArgumentException("Periodo no encontrado"));

        if (periodo.getEstado() == PeriodoEstado.CERRADO) {
            throw new IllegalStateException("El periodo ya se encuentra cerrado");
        }

        BigDecimal saldoAnt = calcularSaldoAnterior(cajaId, periodo.getAnio(), periodo.getMes());
        List<Operacion> vigentes = operacionRepository.findByCajaIdAndPeriodoIdAndEstadoOrderByFechaAscNroReciboAsc(
                cajaId, periodoId, OperacionEstado.VIGENTE);

        BigDecimal totalIngresos = BigDecimal.ZERO;
        BigDecimal totalEgresos = BigDecimal.ZERO;

        Map<String, BigDecimal> totalesConcepto = new HashMap<>();

        for (Operacion op : vigentes) {
            for (OperacionDetalle det : op.getDetalles()) {
                Concepto conc = conceptoRepository.findById(det.getConceptoId()).orElse(null);
                String codigo = conc != null ? conc.getCodigo() : "CONCEPTO_" + det.getConceptoId();

                totalesConcepto.merge(codigo, det.getMonto(), BigDecimal::add);

                if (det.getTipo() == FlujoTipo.INGRESO) {
                    totalIngresos = totalIngresos.add(det.getMonto());
                } else {
                    totalEgresos = totalEgresos.add(det.getMonto());
                }
            }
        }

        BigDecimal saldoFinal = saldoAnt.add(totalIngresos).subtract(totalEgresos);

        Map<String, Object> detalleMap = new HashMap<>();
        totalesConcepto.forEach((k, v) -> detalleMap.put(k, v.toPlainString()));

        String rawHash = cajaId + "|" + periodoId + "|" + periodo.getAnio() + "|" + periodo.getMes() + "|" +
                saldoAnt.toPlainString() + "|" + totalIngresos.toPlainString() + "|" + totalEgresos.toPlainString() + "|" +
                saldoFinal.toPlainString();
        String hashIntegridad = sha256Hex(rawHash);

        CierrePeriodo cierre = new CierrePeriodo(
                periodoId,
                saldoAnt,
                totalIngresos,
                totalEgresos,
                detalleMap,
                hashIntegridad,
                userId
        );

        CierrePeriodo guardado = cierrePeriodoRepository.save(cierre);
        periodo.cerrar(userId);
        periodoRepository.save(periodo);

        auditService.registrar(
                cajaId,
                userId,
                UserRole.ADMIN,
                "PERIODO_CERRADO",
                "periodo",
                periodoId,
                null,
                Map.of("saldoFinal", saldoFinal.toString(), "hashIntegridad", hashIntegridad),
                "127.0.0.1",
                "Internal"
        );

        return new CierrePeriodoResponse(
                guardado.getPeriodoId(),
                guardado.getSaldoAnterior(),
                guardado.getTotalIngresos(),
                guardado.getTotalEgresos(),
                guardado.getSaldoFinal(),
                guardado.getHashIntegridad(),
                guardado.getDetalle(),
                guardado.getCreatedAt()
        );
    }

    @Transactional
    public PeriodoResponse reabrirPeriodo(UUID periodoId, ReabrirPeriodoRequest req) {
        UUID cajaId = getCajaIdActual();
        UUID userId = getUserIdActual();

        Periodo periodo = periodoRepository.findByIdAndCajaId(periodoId, cajaId)
                .orElseThrow(() -> new IllegalArgumentException("Periodo no encontrado"));

        if (periodo.getEstado() != PeriodoEstado.CERRADO) {
            throw new IllegalStateException("Solo se pueden reabrir periodos cerrados");
        }

        cierrePeriodoRepository.deleteById(periodoId);
        periodo.reabrir();
        Periodo guardado = periodoRepository.save(periodo);

        auditService.registrar(
                cajaId,
                userId,
                UserRole.ADMIN,
                "PERIODO_REABIERTO",
                "periodo",
                periodoId,
                null,
                Map.of("motivo", req.motivo()),
                "127.0.0.1",
                "Internal"
        );

        BigDecimal saldoAnt = calcularSaldoAnterior(cajaId, guardado.getAnio(), guardado.getMes());
        return toPeriodoResponse(guardado, saldoAnt, BigDecimal.ZERO, BigDecimal.ZERO, saldoAnt);
    }

    // ==========================================
    // 5. Planilla Mensual (Réplica exacta Excel)
    // ==========================================

    @Transactional(readOnly = true)
    public PlanillaMensualResponse obtenerPlanillaMensual(UUID periodoId) {
        UUID cajaId = getCajaIdActual();
        Periodo periodo = periodoRepository.findByIdAndCajaId(periodoId, cajaId)
                .orElseThrow(() -> new IllegalArgumentException("Periodo no encontrado"));

        BigDecimal saldoAnt = calcularSaldoAnterior(cajaId, periodo.getAnio(), periodo.getMes());

        List<Operacion> operacionesVigentes = operacionRepository.findByCajaIdAndPeriodoIdAndEstadoOrderByFechaAscNroReciboAsc(
                cajaId, periodoId, OperacionEstado.VIGENTE);

        List<Socio> sociosActivos = socioRepository.findByCajaIdAndDeletedAtIsNullOrderByCodigoAsc(cajaId);

        // Agrupar operaciones por socioId
        Map<UUID, List<Operacion>> opsPorSocio = operacionesVigentes.stream()
                .filter(o -> o.getSocioId() != null)
                .collect(Collectors.groupingBy(Operacion::getSocioId));

        Map<Short, Concepto> conceptosMap = conceptoRepository.findAll().stream()
                .filter(c -> c.getId() != null)
                .collect(Collectors.toMap(Concepto::getId, c -> c, (a, b) -> a));

        List<FilaPlanillaMensual> filas = new ArrayList<>();

        // Totales por concepto
        Map<String, BigDecimal> totIng = new HashMap<>();
        Map<String, BigDecimal> totEg = new HashMap<>();

        // Inicializar mapas
        for (String c : List.of("DEPOSITO_AHORRO", "PAGO_CAPITAL", "INTERES_RECIBIDO", "ACCION", "MULTA_TARDANZA", "RESERVA", "OTRO_INGRESO")) {
            totIng.put(c, BigDecimal.ZERO);
        }
        for (String c : List.of("RETIRO_AHORRO", "PRESTAMO", "INTERES_PAGADO", "GASTO_ADMIN", "UTILIDAD_DISTRIBUIDA", "RED", "OTRO_EGRESO")) {
            totEg.put(c, BigDecimal.ZERO);
        }

        // Set de todos los socios a mostrar: socios activos o socios con operaciones en este mes
        Set<UUID> todosSocioIds = new TreeSet<>();
        sociosActivos.stream().filter(s -> s.getEstado() == SocioEstado.ACTIVO).forEach(s -> todosSocioIds.add(s.getId()));
        todosSocioIds.addAll(opsPorSocio.keySet());

        Map<UUID, Socio> sociosById = sociosActivos.stream().collect(Collectors.toMap(Socio::getId, s -> s));

        for (UUID sId : todosSocioIds) {
            Socio s = sociosById.get(sId);
            if (s == null) {
                s = socioRepository.findById(sId).orElse(null);
            }
            if (s == null) continue;

            List<Operacion> socioOps = opsPorSocio.getOrDefault(sId, Collections.emptyList());

            Integer recibo = null;
            UUID opIngresoId = null;
            UUID opEgresoId = null;

            BigDecimal ahorro = BigDecimal.ZERO;
            BigDecimal pagoCapital = BigDecimal.ZERO;
            BigDecimal interesRecibido = BigDecimal.ZERO;
            BigDecimal acciones = BigDecimal.ZERO;
            BigDecimal tardanzaMulta = BigDecimal.ZERO;
            BigDecimal reservas = BigDecimal.ZERO;
            BigDecimal totalIngreso = BigDecimal.ZERO;

            BigDecimal retiroAhorro = BigDecimal.ZERO;
            BigDecimal prestamo = BigDecimal.ZERO;
            BigDecimal interesPagado = BigDecimal.ZERO;
            BigDecimal gastoAdmin = BigDecimal.ZERO;
            BigDecimal utilidad = BigDecimal.ZERO;
            BigDecimal red = BigDecimal.ZERO;
            BigDecimal otroEgreso = BigDecimal.ZERO;
            BigDecimal totalEgreso = BigDecimal.ZERO;

            for (Operacion op : socioOps) {
                if (op.getTipo() == FlujoTipo.INGRESO) {
                    if (recibo == null && op.getNroRecibo() != null) recibo = op.getNroRecibo();
                    if (opIngresoId == null) opIngresoId = op.getId();
                } else {
                    if (opEgresoId == null) opEgresoId = op.getId();
                }

                for (OperacionDetalle d : op.getDetalles()) {
                    Concepto conc = conceptosMap.get(d.getConceptoId());
                    if (conc == null) continue;
                    String codigo = conc.getCodigo();
                    BigDecimal m = d.getMonto();

                    switch (codigo) {
                        case "DEPOSITO_AHORRO" -> { ahorro = ahorro.add(m); totalIngreso = totalIngreso.add(m); totIng.merge(codigo, m, BigDecimal::add); }
                        case "PAGO_CAPITAL" -> { pagoCapital = pagoCapital.add(m); totalIngreso = totalIngreso.add(m); totIng.merge(codigo, m, BigDecimal::add); }
                        case "INTERES_RECIBIDO" -> { interesRecibido = interesRecibido.add(m); totalIngreso = totalIngreso.add(m); totIng.merge(codigo, m, BigDecimal::add); }
                        case "ACCION" -> { acciones = acciones.add(m); totalIngreso = totalIngreso.add(m); totIng.merge(codigo, m, BigDecimal::add); }
                        case "MULTA_TARDANZA" -> { tardanzaMulta = tardanzaMulta.add(m); totalIngreso = totalIngreso.add(m); totIng.merge(codigo, m, BigDecimal::add); }
                        case "RESERVA" -> { reservas = reservas.add(m); totalIngreso = totalIngreso.add(m); totIng.merge(codigo, m, BigDecimal::add); }
                        case "RETIRO_AHORRO" -> { retiroAhorro = retiroAhorro.add(m); totalEgreso = totalEgreso.add(m); totEg.merge(codigo, m, BigDecimal::add); }
                        case "PRESTAMO" -> { prestamo = prestamo.add(m); totalEgreso = totalEgreso.add(m); totEg.merge(codigo, m, BigDecimal::add); }
                        case "INTERES_PAGADO" -> { interesPagado = interesPagado.add(m); totalEgreso = totalEgreso.add(m); totEg.merge(codigo, m, BigDecimal::add); }
                        case "GASTO_ADMIN" -> { gastoAdmin = gastoAdmin.add(m); totalEgreso = totalEgreso.add(m); totEg.merge(codigo, m, BigDecimal::add); }
                        case "UTILIDAD_DISTRIBUIDA" -> { utilidad = utilidad.add(m); totalEgreso = totalEgreso.add(m); totEg.merge(codigo, m, BigDecimal::add); }
                        case "RED" -> { red = red.add(m); totalEgreso = totalEgreso.add(m); totEg.merge(codigo, m, BigDecimal::add); }
                        case "OTRO_EGRESO" -> { otroEgreso = otroEgreso.add(m); totalEgreso = totalEgreso.add(m); totEg.merge(codigo, m, BigDecimal::add); }
                        default -> {
                            if (conc.getTipo() == FlujoTipo.INGRESO) {
                                totalIngreso = totalIngreso.add(m);
                                totIng.merge("OTRO_INGRESO", m, BigDecimal::add);
                            } else {
                                otroEgreso = otroEgreso.add(m);
                                totalEgreso = totalEgreso.add(m);
                                totEg.merge("OTRO_EGRESO", m, BigDecimal::add);
                            }
                        }
                    }
                }
            }

            filas.add(new FilaPlanillaMensual(
                    recibo,
                    s.getId(),
                    s.getNombreCompleto(),
                    s.getCodigo(),
                    ahorro,
                    pagoCapital,
                    interesRecibido,
                    acciones,
                    tardanzaMulta,
                    reservas,
                    totalIngreso,
                    retiroAhorro,
                    prestamo,
                    interesPagado,
                    gastoAdmin,
                    utilidad,
                    red,
                    otroEgreso,
                    totalEgreso,
                    opIngresoId,
                    opEgresoId
            ));
        }

        // Operaciones sin socio (gastos de caja general / administrativos)
        List<Operacion> opsSinSocio = operacionesVigentes.stream()
                .filter(o -> o.getSocioId() == null)
                .toList();

        if (!opsSinSocio.isEmpty()) {
            BigDecimal gastoAdmin = BigDecimal.ZERO;
            BigDecimal red = BigDecimal.ZERO;
            BigDecimal reservas = BigDecimal.ZERO;
            BigDecimal otroEgreso = BigDecimal.ZERO;
            BigDecimal totalIngreso = BigDecimal.ZERO;
            BigDecimal totalEgreso = BigDecimal.ZERO;

            for (Operacion op : opsSinSocio) {
                for (OperacionDetalle d : op.getDetalles()) {
                    Concepto conc = conceptosMap.get(d.getConceptoId());
                    if (conc == null) continue;
                    BigDecimal m = d.getMonto();
                    if ("GASTO_ADMIN".equals(conc.getCodigo())) {
                        gastoAdmin = gastoAdmin.add(m);
                        totalEgreso = totalEgreso.add(m);
                        totEg.merge("GASTO_ADMIN", m, BigDecimal::add);
                    } else if ("RED".equals(conc.getCodigo())) {
                        red = red.add(m);
                        totalEgreso = totalEgreso.add(m);
                        totEg.merge("RED", m, BigDecimal::add);
                    } else if ("RESERVA".equals(conc.getCodigo())) {
                        reservas = reservas.add(m);
                        totalIngreso = totalIngreso.add(m);
                        totIng.merge("RESERVA", m, BigDecimal::add);
                    } else {
                        if (conc.getTipo() == FlujoTipo.INGRESO) {
                            totalIngreso = totalIngreso.add(m);
                            totIng.merge("OTRO_INGRESO", m, BigDecimal::add);
                        } else {
                            otroEgreso = otroEgreso.add(m);
                            totalEgreso = totalEgreso.add(m);
                            totEg.merge("OTRO_EGRESO", m, BigDecimal::add);
                        }
                    }
                }
            }

            filas.add(new FilaPlanillaMensual(
                    null,
                    null,
                    "CAJA GENERAL / GASTOS INSTITUCIONALES",
                    999,
                    BigDecimal.ZERO,
                    BigDecimal.ZERO,
                    BigDecimal.ZERO,
                    BigDecimal.ZERO,
                    BigDecimal.ZERO,
                    reservas,
                    totalIngreso,
                    BigDecimal.ZERO,
                    BigDecimal.ZERO,
                    BigDecimal.ZERO,
                    gastoAdmin,
                    BigDecimal.ZERO,
                    red,
                    otroEgreso,
                    totalEgreso,
                    null,
                    null
            ));
        }

        // Ordenar filas por código de socio
        filas.sort(Comparator.comparing(FilaPlanillaMensual::socioCodigo, Comparator.nullsLast(Comparator.naturalOrder())));

        BigDecimal totalIngresosMes = filas.stream().map(FilaPlanillaMensual::totalIngreso).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalEgresosMes = filas.stream().map(FilaPlanillaMensual::totalEgreso).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal saldoFinal = saldoAnt.add(totalIngresosMes).subtract(totalEgresosMes);

        PeriodoResponse pResp = toPeriodoResponse(periodo, saldoAnt, totalIngresosMes, totalEgresosMes, saldoFinal);

        return new PlanillaMensualResponse(
                pResp,
                filas,
                totIng,
                totEg,
                totalIngresosMes,
                totalEgresosMes,
                saldoAnt,
                saldoFinal
        );
    }

    // ==========================================
    // 6. Conceptos
    // ==========================================

    @Transactional(readOnly = true)
    public List<ConceptoResponse> listarConceptos() {
        return conceptoRepository.findByActivoTrueOrderByOrdenAsc().stream()
                .map(c -> new ConceptoResponse(c.getId(), c.getCodigo(), c.getNombre(), c.getTipo(), c.isRequiereSocio(), c.getOrden()))
                .toList();
    }

    // ==========================================
    // Helpers internos
    // ==========================================

    public BigDecimal calcularSaldoAnterior(UUID cajaId, Short anio, Short mes) {
        // Encontrar periodos anteriores
        List<Periodo> anteriores = periodoRepository.findByCajaIdOrderByAnioDescMesDesc(cajaId).stream()
                .filter(p -> p.getAnio() < anio || (p.getAnio().equals(anio) && p.getMes() < mes))
                .toList();

        if (anteriores.isEmpty()) {
            return BigDecimal.ZERO;
        }

        // Si el periodo inmediatamente anterior está cerrado, su saldo final es el saldo anterior
        Periodo prev = anteriores.get(0);
        if (prev.getEstado() == PeriodoEstado.CERRADO) {
            Optional<CierrePeriodo> cierreOpt = cierrePeriodoRepository.findById(prev.getId());
            if (cierreOpt.isPresent()) {
                return cierreOpt.get().getSaldoFinal();
            }
        }

        // Si no está cerrado o requerimos calcular acumulado:
        // Sumar todos los movimientos de periodos anteriores
        BigDecimal ingresosAcum = BigDecimal.ZERO;
        BigDecimal egresosAcum = BigDecimal.ZERO;

        for (Periodo p : anteriores) {
            List<Operacion> vigentes = operacionRepository.findByCajaIdAndPeriodoIdAndEstadoOrderByFechaAscNroReciboAsc(
                    cajaId, p.getId(), OperacionEstado.VIGENTE);

            for (Operacion op : vigentes) {
                if (op.getTipo() == FlujoTipo.INGRESO) {
                    ingresosAcum = ingresosAcum.add(op.getTotal());
                } else {
                    egresosAcum = egresosAcum.add(op.getTotal());
                }
            }
        }

        return ingresosAcum.subtract(egresosAcum);
    }

    private String sha256Hex(String text) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(text.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Error calculando hash SHA-256", e);
        }
    }

    private PeriodoResponse toPeriodoResponse(Periodo p, BigDecimal saldoAnt, BigDecimal ing, BigDecimal eg, BigDecimal saldoFin) {
        return new PeriodoResponse(
                p.getId(),
                p.getAnio(),
                p.getMes(),
                p.getFechaReunion(),
                p.getEstado(),
                p.getCerradoAt(),
                p.getCerradoPor(),
                saldoAnt != null ? saldoAnt : BigDecimal.ZERO,
                ing != null ? ing : BigDecimal.ZERO,
                eg != null ? eg : BigDecimal.ZERO,
                saldoFin != null ? saldoFin : BigDecimal.ZERO
        );
    }

    private OperacionResponse toOperacionResponse(Operacion o, Socio socio) {
        Map<Short, Concepto> concMap = conceptoRepository.findAll().stream()
                .collect(Collectors.toMap(Concepto::getId, c -> c));

        List<DetalleOperacionResponse> detalles = o.getDetalles().stream().map(d -> {
            Concepto c = concMap.get(d.getConceptoId());
            return new DetalleOperacionResponse(
                    d.getId(),
                    d.getConceptoId(),
                    c != null ? c.getCodigo() : "N/A",
                    c != null ? c.getNombre() : "N/A",
                    d.getMonto()
            );
        }).toList();

        return new OperacionResponse(
                o.getId(),
                o.getPeriodoId(),
                o.getSocioId(),
                socio != null ? socio.getNombreCompleto() : null,
                socio != null ? socio.getCodigo() : null,
                o.getTipo(),
                o.getFecha(),
                o.getNroRecibo(),
                o.getDescripcion(),
                o.getTotal(),
                o.getEstado(),
                detalles,
                o.getAnuladoAt(),
                o.getMotivoAnulacion()
        );
    }

    private ArqueoResponse toArqueoResponse(ArqueoCaja a) {
        return new ArqueoResponse(
                a.getPeriodoId(),
                a.getEfectivo(),
                a.getDepositosBancos(),
                a.getTotalContado(),
                a.getSaldoSistema(),
                a.getDiferencia(),
                a.getObservacion(),
                a.getCreatedAt()
        );
    }

    private UUID getCajaIdActual() {
        UserContext ctx = UserContextHolder.getContext();
        if (ctx != null && ctx.cajaId() != null) {
            return ctx.cajaId();
        }
        return UUID.fromString("a0000000-0000-0000-0000-000000000001");
    }

    private UUID getUserIdActual() {
        UserContext ctx = UserContextHolder.getContext();
        return (ctx != null) ? ctx.userId() : null;
    }
}
