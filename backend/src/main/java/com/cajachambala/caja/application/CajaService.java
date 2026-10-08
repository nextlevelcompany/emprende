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
import com.cajachambala.prestamos.domain.CuotaEstado;
import com.cajachambala.prestamos.domain.CuotaPrestamo;
import com.cajachambala.prestamos.domain.Prestamo;
import com.cajachambala.prestamos.domain.PrestamoEstado;
import com.cajachambala.prestamos.infrastructure.persistence.CuotaPrestamoRepository;
import com.cajachambala.prestamos.infrastructure.persistence.PrestamoRepository;
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
    private final PrestamoRepository prestamoRepository;
    private final CuotaPrestamoRepository cuotaPrestamoRepository;
    private final AuditService auditService;

    public CajaService(
            PeriodoRepository periodoRepository,
            ConceptoRepository conceptoRepository,
            OperacionRepository operacionRepository,
            CierrePeriodoRepository cierrePeriodoRepository,
            ArqueoCajaRepository arqueoCajaRepository,
            SocioRepository socioRepository,
            PrestamoRepository prestamoRepository,
            CuotaPrestamoRepository cuotaPrestamoRepository,
            AuditService auditService
    ) {
        this.periodoRepository = periodoRepository;
        this.conceptoRepository = conceptoRepository;
        this.operacionRepository = operacionRepository;
        this.cierrePeriodoRepository = cierrePeriodoRepository;
        this.arqueoCajaRepository = arqueoCajaRepository;
        this.socioRepository = socioRepository;
        this.prestamoRepository = prestamoRepository;
        this.cuotaPrestamoRepository = cuotaPrestamoRepository;
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
        List<Operacion> vigentes = operacionRepository.findByCajaIdAndPeriodoIdAndEstadoOrderByFechaAscNroReciboAsc(
                cajaId, guardado.getId(), OperacionEstado.VIGENTE);
        BigDecimal ingresos = vigentes.stream()
                .filter(o -> o.getTipo() == FlujoTipo.INGRESO)
                .map(Operacion::getTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal saldoFin = saldoAnt.add(ingresos);
        return toPeriodoResponse(guardado, saldoAnt, ingresos, BigDecimal.ZERO, saldoFin);
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

        // Si existe una diferencia residual por redondeo de céntimos (menor o igual a S/. 0.50), se cuadra automáticamente
        if (saldoFinal.compareTo(BigDecimal.ZERO) != 0 && saldoFinal.abs().compareTo(new BigDecimal("0.50")) <= 0) {
            BigDecimal montoAjuste = saldoFinal.abs().setScale(2, java.math.RoundingMode.HALF_UP);
            if (saldoFinal.compareTo(BigDecimal.ZERO) > 0) {
                Concepto concEgreso = conceptoRepository.findByCodigo("OTRO_EGRESO")
                        .orElseThrow(() -> new IllegalStateException("Concepto OTRO_EGRESO no encontrado"));
                Operacion opAjuste = new Operacion(cajaId, periodoId, null, FlujoTipo.EGRESO, periodo.getFechaReunion(), null, "Ajuste por redondeo de caja / cuadre al cierre", userId);
                opAjuste.agregarDetalle(concEgreso.getId(), montoAjuste, null, null);
                operacionRepository.save(opAjuste);
                totalEgresos = totalEgresos.add(montoAjuste);
                totalesConcepto.merge("OTRO_EGRESO", montoAjuste, BigDecimal::add);
            } else {
                Concepto concIngreso = conceptoRepository.findByCodigo("OTRO_INGRESO")
                        .orElseThrow(() -> new IllegalStateException("Concepto OTRO_INGRESO no encontrado"));
                Operacion opAjuste = new Operacion(cajaId, periodoId, null, FlujoTipo.INGRESO, periodo.getFechaReunion(), null, "Ajuste por redondeo de caja / cuadre al cierre", userId);
                opAjuste.agregarDetalle(concIngreso.getId(), montoAjuste, null, null);
                operacionRepository.save(opAjuste);
                totalIngresos = totalIngresos.add(montoAjuste);
                totalesConcepto.merge("OTRO_INGRESO", montoAjuste, BigDecimal::add);
            }
            saldoFinal = saldoAnt.add(totalIngresos).subtract(totalEgresos);
        }

        if (saldoFinal.compareTo(BigDecimal.ZERO) != 0) {
            throw new IllegalStateException("No se puede cerrar la caja. Existe un saldo disponible de S/. " +
                    saldoFinal.setScale(2, java.math.RoundingMode.HALF_UP).toPlainString() +
                    ". En la metodología de Caja Comunal, todos los fondos recaudados deben colocarse en préstamos (u otros egresos) hasta que el saldo llegue a cero (S/. 0.00).");
        }

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
    // 5. Planilla Mensual (Réplica exacta Excel e interactiva)
    // ==========================================

    @Transactional
    public void precargarPlanillaPorDefecto(Periodo periodo, UUID userId) {
        UUID cajaId = periodo.getCajaId();
        List<Socio> sociosActivos = socioRepository.findByCajaIdAndDeletedAtIsNullOrderByCodigoAsc(cajaId).stream()
                .filter(s -> s.getEstado() == SocioEstado.ACTIVO)
                .toList();

        if (sociosActivos.isEmpty()) {
            return;
        }

        Concepto concAccion = conceptoRepository.findByCodigo("ACCION")
                .orElseThrow(() -> new IllegalStateException("Concepto ACCION no encontrado"));
        Concepto concCapCobrado = conceptoRepository.findByCodigo("PAGO_CAPITAL")
                .orElseThrow(() -> new IllegalStateException("Concepto PAGO_CAPITAL no encontrado"));
        Concepto concIntRecibido = conceptoRepository.findByCodigo("INTERES_RECIBIDO")
                .orElseThrow(() -> new IllegalStateException("Concepto INTERES_RECIBIDO no encontrado"));

        List<CuotaPrestamo> todasCuotasPendientes = cuotaPrestamoRepository.findPendientesVigentesPorCaja(cajaId);
        Map<UUID, List<CuotaPrestamo>> cuotasPorSocio = todasCuotasPendientes.stream()
                .collect(Collectors.groupingBy(c -> c.getPrestamo().getSocioId()));

        Integer ultimoRecibo = operacionRepository.findMaxNroReciboByCajaId(cajaId);
        int nroRecibo = ultimoRecibo != null ? ultimoRecibo : 0;
        LocalDate fecha = periodo.getFechaReunion();

        for (Socio socio : sociosActivos) {
            nroRecibo++;
            String desc = "Aportes y cobranzas " + periodo.getMes() + "/" + periodo.getAnio() + " - " + socio.getNombreCompleto();
            Operacion op = new Operacion(cajaId, periodo.getId(), socio.getId(), FlujoTipo.INGRESO, fecha, nroRecibo, desc, userId);

            // 1. Al menos 1 acción por defecto (S/ 30.00)
            BigDecimal montoAccion = new BigDecimal("30.00");
            op.agregarDetalle(concAccion.getId(), montoAccion, null, null);

            // 2. Cuotas de deudas e intereses vigentes correspondientes a este periodo
            List<CuotaPrestamo> cuotasSocio = cuotasPorSocio.getOrDefault(socio.getId(), Collections.emptyList());
            Map<UUID, Optional<CuotaPrestamo>> cuotaPorPrestamo = cuotasSocio.stream()
                    .filter(c -> !c.getFechaVencimiento().isAfter(fecha) ||
                            (c.getFechaVencimiento().getYear() == periodo.getAnio() && c.getFechaVencimiento().getMonthValue() == periodo.getMes()))
                    .collect(Collectors.groupingBy(c -> c.getPrestamo().getId(),
                            Collectors.minBy(Comparator.comparing(CuotaPrestamo::getNroCuota))));

            for (Optional<CuotaPrestamo> optCuota : cuotaPorPrestamo.values()) {
                if (optCuota.isPresent()) {
                    CuotaPrestamo cuota = optCuota.get();
                    Prestamo prestamo = cuota.getPrestamo();
                    BigDecimal capProg = cuota.getSaldoCapitalPendiente();
                    BigDecimal intProg = cuota.getSaldoInteresPendiente();

                    if (capProg.compareTo(BigDecimal.ZERO) > 0) {
                        op.agregarDetalle(concCapCobrado.getId(), capProg, prestamo.getId(), cuota.getId());
                    }
                    if (intProg.compareTo(BigDecimal.ZERO) > 0) {
                        op.agregarDetalle(concIntRecibido.getId(), intProg, prestamo.getId(), cuota.getId());
                    }

                    cuota.fijarPago(cuota.getCapitalProgramado(), cuota.getInteresProgramado(), BigDecimal.ZERO, fecha);
                    cuotaPrestamoRepository.save(cuota);
                    prestamo.verificarEstadoCancelacion();
                    prestamoRepository.save(prestamo);
                }
            }

            operacionRepository.save(op);
        }
    }

    @Transactional
    public PlanillaMensualResponse precargarPlanilla(UUID periodoId) {
        UUID cajaId = getCajaIdActual();
        UUID userId = getUserIdActual();
        Periodo periodo = periodoRepository.findByIdAndCajaId(periodoId, cajaId)
                .orElseThrow(() -> new IllegalArgumentException("Periodo no encontrado"));

        if (periodo.getEstado() == PeriodoEstado.CERRADO) {
            throw new IllegalStateException("No se puede pre-cargar un periodo cerrado");
        }

        List<Operacion> opsExistentes = operacionRepository.findByCajaIdAndPeriodoIdAndEstadoOrderByFechaAscNroReciboAsc(
                cajaId, periodoId, OperacionEstado.VIGENTE);
        for (Operacion op : opsExistentes) {
            if (op.getSocioId() != null && op.getTipo() == FlujoTipo.INGRESO) {
                for (OperacionDetalle d : op.getDetalles()) {
                    if (d.getCuotaId() != null) {
                        cuotaPrestamoRepository.findById(d.getCuotaId()).ifPresent(c -> {
                            c.revertirPago();
                            cuotaPrestamoRepository.save(c);
                            c.getPrestamo().verificarEstadoCancelacion();
                            prestamoRepository.save(c.getPrestamo());
                        });
                    }
                }
                op.anular(userId, "Restablecimiento de pre-carga de planilla");
                operacionRepository.save(op);
            }
        }

        return obtenerPlanillaMensual(periodoId);
    }

    @Transactional
    public PlanillaMensualResponse obtenerPlanillaMensual(UUID periodoId) {
        UUID cajaId = getCajaIdActual();
        Periodo periodo = periodoRepository.findByIdAndCajaId(periodoId, cajaId)
                .orElseThrow(() -> new IllegalArgumentException("Periodo no encontrado"));

        BigDecimal saldoAnt = calcularSaldoAnterior(cajaId, periodo.getAnio(), periodo.getMes());

        List<Operacion> operacionesVigentes = operacionRepository.findByCajaIdAndPeriodoIdAndEstadoOrderByFechaAscNroReciboAsc(
                cajaId, periodoId, OperacionEstado.VIGENTE);

        List<Socio> sociosActivos = socioRepository.findByCajaIdAndDeletedAtIsNullOrderByCodigoAsc(cajaId);

        Map<UUID, List<Operacion>> opsPorSocio = operacionesVigentes.stream()
                .filter(o -> o.getSocioId() != null)
                .collect(Collectors.groupingBy(Operacion::getSocioId));

        Map<Short, Concepto> conceptosMap = conceptoRepository.findAll().stream()
                .filter(c -> c.getId() != null)
                .collect(Collectors.toMap(Concepto::getId, c -> c, (a, b) -> a));

        List<CuotaPrestamo> todasCuotasPendientes = cuotaPrestamoRepository.findPendientesVigentesPorCaja(cajaId);
        Map<UUID, List<CuotaPrestamo>> cuotasPorSocio = todasCuotasPendientes.stream()
                .collect(Collectors.groupingBy(c -> c.getPrestamo().getSocioId()));

        List<FilaPlanillaMensual> filas = new ArrayList<>();

        Map<String, BigDecimal> totIng = new HashMap<>();
        Map<String, BigDecimal> totEg = new HashMap<>();

        for (String c : List.of("DEPOSITO_AHORRO", "PAGO_CAPITAL", "INTERES_RECIBIDO", "ACCION", "MULTA_TARDANZA", "RESERVA", "OTRO_INGRESO")) {
            totIng.put(c, BigDecimal.ZERO);
        }
        for (String c : List.of("RETIRO_AHORRO", "PRESTAMO", "INTERES_PAGADO", "GASTO_ADMIN", "UTILIDAD_DISTRIBUIDA", "RED", "OTRO_EGRESO")) {
            totEg.put(c, BigDecimal.ZERO);
        }

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
            UUID prestamoId = null;

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

            UUID cuotaId = null;

            List<UUID> cuotasIdsEnOps = new ArrayList<>();
            for (Operacion op : socioOps) {
                if (op.getTipo() == FlujoTipo.INGRESO) {
                    if (recibo == null && op.getNroRecibo() != null) recibo = op.getNroRecibo();
                    if (opIngresoId == null) opIngresoId = op.getId();
                } else {
                    if (opEgresoId == null) opEgresoId = op.getId();
                }

                for (OperacionDetalle d : op.getDetalles()) {
                    if (d.getCuotaId() != null && !cuotasIdsEnOps.contains(d.getCuotaId())) {
                        cuotasIdsEnOps.add(d.getCuotaId());
                    }
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

            List<CuotaPrestamo> cuotasDelSocio = cuotasPorSocio.getOrDefault(sId, Collections.emptyList());
            List<DetalleCuotaPlanilla> detallesPrestamos = new ArrayList<>();
            List<DetalleCuotaPlanilla> cuotasDisponiblesAdelanto = new ArrayList<>();

            boolean tieneOperacionIngreso = (opIngresoId != null);
            boolean accionesPagado = tieneOperacionIngreso && (acciones.compareTo(BigDecimal.ZERO) > 0);
            boolean cuotaPagada = tieneOperacionIngreso && (pagoCapital.compareTo(BigDecimal.ZERO) > 0 || interesRecibido.compareTo(BigDecimal.ZERO) > 0);

            if (!cuotasIdsEnOps.isEmpty()) {
                // Hay cuotas asociadas en operaciones de este periodo
                for (UUID cId : cuotasIdsEnOps) {
                    CuotaPrestamo cp = cuotaPrestamoRepository.findById(cId).orElse(null);
                    if (cp != null) {
                        BigDecimal capPagadoCuota = BigDecimal.ZERO;
                        BigDecimal intPagadoCuota = BigDecimal.ZERO;
                        for (Operacion op : socioOps) {
                            for (OperacionDetalle d : op.getDetalles()) {
                                if (Objects.equals(d.getCuotaId(), cId)) {
                                    Concepto conc = conceptosMap.get(d.getConceptoId());
                                    if (conc != null) {
                                        if ("PAGO_CAPITAL".equals(conc.getCodigo())) {
                                            capPagadoCuota = capPagadoCuota.add(d.getMonto());
                                        } else if ("INTERES_RECIBIDO".equals(conc.getCodigo())) {
                                            intPagadoCuota = intPagadoCuota.add(d.getMonto());
                                        }
                                    }
                                }
                            }
                        }
                        boolean esAdelanto = esCuotaAdelanto(cp, periodo);
                        detallesPrestamos.add(new DetalleCuotaPlanilla(
                                cp.getPrestamo().getId(),
                                cp.getPrestamo().getNumero(),
                                cp.getId(),
                                cp.getNroCuota().intValue(),
                                cp.getPrestamo().getNroCuotas().intValue(),
                                cp.getFechaVencimiento(),
                                cp.getCapitalProgramado(),
                                cp.getInteresProgramado(),
                                capPagadoCuota,
                                intPagadoCuota,
                                esAdelanto,
                                cp.getEstado().name()
                        ));
                    }
                }

                // Cuotas regulares del socio que no estuvieron en las operaciones (no pagadas)
                for (CuotaPrestamo cp : cuotasDelSocio) {
                    if (!cuotasIdsEnOps.contains(cp.getId())) {
                        if (!esCuotaAdelanto(cp, periodo)) {
                            detallesPrestamos.add(new DetalleCuotaPlanilla(
                                    cp.getPrestamo().getId(),
                                    cp.getPrestamo().getNumero(),
                                    cp.getId(),
                                    cp.getNroCuota().intValue(),
                                    cp.getPrestamo().getNroCuotas().intValue(),
                                    cp.getFechaVencimiento(),
                                    cp.getCapitalProgramado(),
                                    cp.getInteresProgramado(),
                                    BigDecimal.ZERO,
                                    BigDecimal.ZERO,
                                    false,
                                    cp.getEstado().name()
                            ));
                        } else {
                            cuotasDisponiblesAdelanto.add(new DetalleCuotaPlanilla(
                                    cp.getPrestamo().getId(),
                                    cp.getPrestamo().getNumero(),
                                    cp.getId(),
                                    cp.getNroCuota().intValue(),
                                    cp.getPrestamo().getNroCuotas().intValue(),
                                    cp.getFechaVencimiento(),
                                    cp.getCapitalProgramado(),
                                    cp.getInteresProgramado(),
                                    BigDecimal.ZERO,
                                    BigDecimal.ZERO,
                                    true,
                                    cp.getEstado().name()
                            ));
                        }
                    }
                }
            } else {
                // No hay operaciones registradas aún con cuotas
                for (CuotaPrestamo cp : cuotasDelSocio) {
                    if (!esCuotaAdelanto(cp, periodo)) {
                        detallesPrestamos.add(new DetalleCuotaPlanilla(
                                cp.getPrestamo().getId(),
                                cp.getPrestamo().getNumero(),
                                cp.getId(),
                                cp.getNroCuota().intValue(),
                                cp.getPrestamo().getNroCuotas().intValue(),
                                cp.getFechaVencimiento(),
                                cp.getCapitalProgramado(),
                                cp.getInteresProgramado(),
                                cuotaPagada ? cp.getCapitalProgramado() : BigDecimal.ZERO,
                                cuotaPagada ? cp.getInteresProgramado() : BigDecimal.ZERO,
                                false,
                                cp.getEstado().name()
                        ));
                    } else {
                        cuotasDisponiblesAdelanto.add(new DetalleCuotaPlanilla(
                                cp.getPrestamo().getId(),
                                cp.getPrestamo().getNumero(),
                                cp.getId(),
                                cp.getNroCuota().intValue(),
                                cp.getPrestamo().getNroCuotas().intValue(),
                                cp.getFechaVencimiento(),
                                cp.getCapitalProgramado(),
                                cp.getInteresProgramado(),
                                BigDecimal.ZERO,
                                BigDecimal.ZERO,
                                true,
                                cp.getEstado().name()
                        ));
                    }
                }
            }

            detallesPrestamos.sort(Comparator.comparing(DetalleCuotaPlanilla::fechaVencimiento)
                    .thenComparing(DetalleCuotaPlanilla::prestamoNumero)
                    .thenComparing(DetalleCuotaPlanilla::cuotaNro));

            cuotasDisponiblesAdelanto.sort(Comparator.comparing(DetalleCuotaPlanilla::fechaVencimiento)
                    .thenComparing(DetalleCuotaPlanilla::prestamoNumero)
                    .thenComparing(DetalleCuotaPlanilla::cuotaNro));

            BigDecimal cuotaCapProg = BigDecimal.ZERO;
            BigDecimal cuotaIntProg = BigDecimal.ZERO;
            Integer cuotaNro = null;
            Integer cuotasTotal = null;
            Integer prestamoNumero = null;

            if (!detallesPrestamos.isEmpty()) {
                DetalleCuotaPlanilla primera = detallesPrestamos.get(0);
                cuotaId = primera.cuotaId();
                prestamoId = primera.prestamoId();
                prestamoNumero = primera.prestamoNumero();
                cuotaNro = primera.cuotaNro();
                cuotasTotal = primera.cuotasTotal();

                cuotaCapProg = detallesPrestamos.stream()
                        .map(DetalleCuotaPlanilla::capitalProgramado)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                cuotaIntProg = detallesPrestamos.stream()
                        .map(DetalleCuotaPlanilla::interesProgramado)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
            }

            // Si el periodo está abierto y el socio no tiene operación de ingreso registrada:
            // Por defecto los montos salen NO COBRADOS (accionesPagado = false, cuotaPagada = false, totalIngreso = 0),
            // PERO sí figura el estimado a cobrar en las columnas correspondientes:
            if (periodo.getEstado() == PeriodoEstado.ABIERTO && !tieneOperacionIngreso) {
                accionesPagado = false;
                cuotaPagada = false;
                totalIngreso = BigDecimal.ZERO;
                if (s.getEstado() == SocioEstado.ACTIVO) {
                    acciones = new BigDecimal("30.00");
                }
                if (cuotaId != null) {
                    pagoCapital = cuotaCapProg;
                    interesRecibido = cuotaIntProg;
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
                    opEgresoId,
                    prestamoId,
                    accionesPagado,
                    cuotaPagada,
                    cuotaCapProg,
                    cuotaIntProg,
                    cuotaId,
                    cuotaNro,
                    cuotasTotal,
                    prestamoNumero,
                    detallesPrestamos,
                    cuotasDisponiblesAdelanto
            ));
        }

        // Operaciones sin socio (gastos de caja general / administrativos)
        List<Operacion> opsSinSocio = operacionesVigentes.stream()
                .filter(o -> o.getSocioId() == null)
                .toList();

        if (!opsSinSocio.isEmpty()) {
            BigDecimal gastoAdmin = BigDecimal.ZERO;
            BigDecimal utilidad = BigDecimal.ZERO;
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
                    } else if ("UTILIDAD_DISTRIBUIDA".equals(conc.getCodigo())) {
                        utilidad = utilidad.add(m);
                        totalEgreso = totalEgreso.add(m);
                        totEg.merge("UTILIDAD_DISTRIBUIDA", m, BigDecimal::add);
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
                    utilidad,
                    red,
                    otroEgreso,
                    totalEgreso,
                    null,
                    null,
                    null,
                    false,
                    false,
                    BigDecimal.ZERO,
                    BigDecimal.ZERO,
                    null,
                    null,
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

    @Transactional
    public PlanillaMensualResponse guardarPlanilla(UUID periodoId, GuardarPlanillaRequest req) {
        UUID cajaId = getCajaIdActual();
        UUID userId = getUserIdActual();

        Periodo periodo = periodoRepository.findByIdAndCajaId(periodoId, cajaId)
                .orElseThrow(() -> new IllegalArgumentException("Periodo no encontrado"));

        if (periodo.getEstado() == PeriodoEstado.CERRADO) {
            throw new IllegalStateException("No se puede editar la planilla de un periodo cerrado");
        }

        Concepto concAccion = conceptoRepository.findByCodigo("ACCION")
                .orElseThrow(() -> new IllegalStateException("Concepto ACCION no encontrado"));
        Concepto concCapCobrado = conceptoRepository.findByCodigo("PAGO_CAPITAL")
                .orElseThrow(() -> new IllegalStateException("Concepto PAGO_CAPITAL no encontrado"));
        Concepto concIntRecibido = conceptoRepository.findByCodigo("INTERES_RECIBIDO")
                .orElseThrow(() -> new IllegalStateException("Concepto INTERES_RECIBIDO no encontrado"));
        Concepto concAhorro = conceptoRepository.findByCodigo("DEPOSITO_AHORRO")
                .orElseThrow(() -> new IllegalStateException("Concepto DEPOSITO_AHORRO no encontrado"));
        Concepto concTardanza = conceptoRepository.findByCodigo("MULTA_TARDANZA")
                .orElseThrow(() -> new IllegalStateException("Concepto MULTA_TARDANZA no encontrado"));
        Concepto concReserva = conceptoRepository.findByCodigo("RESERVA")
                .orElseThrow(() -> new IllegalStateException("Concepto RESERVA no encontrado"));

        List<Operacion> operacionesVigentes = operacionRepository.findByCajaIdAndPeriodoIdAndEstadoOrderByFechaAscNroReciboAsc(
                cajaId, periodoId, OperacionEstado.VIGENTE);

        Map<UUID, Operacion> opIngresoPorSocio = operacionesVigentes.stream()
                .filter(o -> o.getSocioId() != null && o.getTipo() == FlujoTipo.INGRESO)
                .collect(Collectors.toMap(Operacion::getSocioId, o -> o, (a, b) -> a));

        Integer maxRecibo = operacionRepository.findMaxNroReciboByCajaId(cajaId);
        int nextRecibo = maxRecibo != null ? maxRecibo : 0;

        for (GuardarFilaPlanillaRequest filaReq : req.filas()) {
            if (filaReq.socioId() == null) continue;

            Socio socio = socioRepository.findByIdAndCajaId(filaReq.socioId(), cajaId).orElse(null);
            if (socio == null) continue;

            boolean accionesPagado = Boolean.TRUE.equals(filaReq.accionesPagado());
            boolean cuotaPagada = Boolean.TRUE.equals(filaReq.cuotaPagada());

            BigDecimal acciones = (accionesPagado && filaReq.acciones() != null) ? filaReq.acciones() : BigDecimal.ZERO;
            BigDecimal pagoCapital = (cuotaPagada && filaReq.pagoCapital() != null) ? filaReq.pagoCapital() : BigDecimal.ZERO;
            BigDecimal interesRecibido = (cuotaPagada && filaReq.interesRecibido() != null) ? filaReq.interesRecibido() : BigDecimal.ZERO;
            BigDecimal ahorro = filaReq.ahorro() != null ? filaReq.ahorro() : BigDecimal.ZERO;
            BigDecimal tardanza = filaReq.tardanzaMulta() != null ? filaReq.tardanzaMulta() : BigDecimal.ZERO;
            BigDecimal reservas = filaReq.reservas() != null ? filaReq.reservas() : BigDecimal.ZERO;

            BigDecimal totalIngreso = acciones.add(pagoCapital).add(interesRecibido).add(ahorro).add(tardanza).add(reservas);

            // Manejo de la cuota del préstamo
            Map<UUID, CuotaPrestamo> cuotasMap = new LinkedHashMap<>();

            Operacion opIngreso = opIngresoPorSocio.get(socio.getId());
            if (opIngreso != null) {
                for (OperacionDetalle d : opIngreso.getDetalles()) {
                    if (d.getCuotaId() != null) {
                        cuotaPrestamoRepository.findById(d.getCuotaId()).ifPresent(c -> cuotasMap.put(c.getId(), c));
                    }
                }
            }

            if (filaReq.cuotaId() != null && !cuotasMap.containsKey(filaReq.cuotaId())) {
                cuotaPrestamoRepository.findById(filaReq.cuotaId()).ifPresent(c -> cuotasMap.put(c.getId(), c));
            }

            List<CuotaPrestamo> cuotasPendientesSocio = cuotaPrestamoRepository.findPendientesVigentesPorSocio(cajaId, socio.getId()).stream()
                    .filter(c -> !c.getFechaVencimiento().isAfter(periodo.getFechaReunion()) ||
                            (c.getFechaVencimiento().getYear() == periodo.getAnio() && c.getFechaVencimiento().getMonthValue() == periodo.getMes()))
                    .toList();
            for (CuotaPrestamo c : cuotasPendientesSocio) {
                cuotasMap.putIfAbsent(c.getId(), c);
            }

            List<CuotaPrestamo> cuotasAProcesar = new ArrayList<>(cuotasMap.values());
            cuotasAProcesar.sort(Comparator.comparing(CuotaPrestamo::getFechaVencimiento)
                    .thenComparing(c -> c.getPrestamo().getNumero())
                    .thenComparing(CuotaPrestamo::getNroCuota));

            Map<UUID, BigDecimal> capPorCuota = new HashMap<>();
            Map<UUID, BigDecimal> intPorCuota = new HashMap<>();
            Set<Prestamo> prestamosAfectados = new HashSet<>();

            if (!cuotaPagada || (pagoCapital.compareTo(BigDecimal.ZERO) <= 0 && interesRecibido.compareTo(BigDecimal.ZERO) <= 0)) {
                for (CuotaPrestamo cuota : cuotasAProcesar) {
                    cuota.revertirPago();
                    cuotaPrestamoRepository.save(cuota);
                    prestamosAfectados.add(cuota.getPrestamo());
                }
            } else {
                for (CuotaPrestamo cuota : cuotasAProcesar) {
                    cuota.revertirPago();
                }

                BigDecimal remCap = pagoCapital;
                BigDecimal remInt = interesRecibido;

                for (CuotaPrestamo cuota : cuotasAProcesar) {
                    BigDecimal capProg = cuota.getCapitalProgramado();
                    BigDecimal intProg = cuota.getInteresProgramado();

                    BigDecimal capAbonar = remCap.min(capProg);
                    BigDecimal intAbonar = remInt.min(intProg);

                    capPorCuota.put(cuota.getId(), capAbonar);
                    intPorCuota.put(cuota.getId(), intAbonar);

                    remCap = remCap.subtract(capAbonar);
                    remInt = remInt.subtract(intAbonar);
                }

                if (remCap.compareTo(BigDecimal.ZERO) > 0 || remInt.compareTo(BigDecimal.ZERO) > 0) {
                    List<CuotaPrestamo> cuotasFuturas = cuotaPrestamoRepository.findPendientesVigentesPorSocio(cajaId, socio.getId()).stream()
                            .filter(c -> !cuotasMap.containsKey(c.getId()))
                            .sorted(Comparator.comparing(CuotaPrestamo::getFechaVencimiento)
                                    .thenComparing(c -> c.getPrestamo().getNumero())
                                    .thenComparing(CuotaPrestamo::getNroCuota))
                            .toList();

                    for (CuotaPrestamo cuota : cuotasFuturas) {
                        if (remCap.compareTo(BigDecimal.ZERO) <= 0 && remInt.compareTo(BigDecimal.ZERO) <= 0) break;
                        BigDecimal capProg = cuota.getCapitalProgramado();
                        BigDecimal intProg = cuota.getInteresProgramado();

                        BigDecimal capAbonar = remCap.min(capProg);
                        BigDecimal intAbonar = remInt.min(intProg);

                        cuotasAProcesar.add(cuota);
                        capPorCuota.put(cuota.getId(), capAbonar);
                        intPorCuota.put(cuota.getId(), intAbonar);

                        remCap = remCap.subtract(capAbonar);
                        remInt = remInt.subtract(intAbonar);
                    }
                }

                if (remCap.compareTo(BigDecimal.ZERO) > 0) {
                    throw new IllegalArgumentException("El pago de capital (S/ " + pagoCapital + ") excede la deuda exigible programada de " + socio.getNombreCompleto());
                }
                if (remInt.compareTo(BigDecimal.ZERO) > 0) {
                    throw new IllegalArgumentException("El pago de interés (S/ " + interesRecibido + ") excede el interés exigible programado de " + socio.getNombreCompleto());
                }

                for (CuotaPrestamo cuota : cuotasAProcesar) {
                    BigDecimal cPag = capPorCuota.getOrDefault(cuota.getId(), BigDecimal.ZERO);
                    BigDecimal iPag = intPorCuota.getOrDefault(cuota.getId(), BigDecimal.ZERO);

                    if (cPag.compareTo(BigDecimal.ZERO) > 0 || iPag.compareTo(BigDecimal.ZERO) > 0) {
                        cuota.fijarPago(cPag, iPag, BigDecimal.ZERO, periodo.getFechaReunion());
                    } else {
                        cuota.revertirPago();
                    }
                    cuotaPrestamoRepository.save(cuota);
                    prestamosAfectados.add(cuota.getPrestamo());
                }
            }

            for (Prestamo prestamo : prestamosAfectados) {
                prestamo.verificarEstadoCancelacion();
                prestamoRepository.save(prestamo);
            }

            // Actualizar o crear Operacion de INGRESO
            if (totalIngreso.compareTo(BigDecimal.ZERO) > 0) {
                if (opIngreso == null) {
                    nextRecibo++;
                    String desc = "Aportes y cobranzas " + periodo.getMes() + "/" + periodo.getAnio() + " - " + socio.getNombreCompleto();
                    opIngreso = new Operacion(cajaId, periodoId, socio.getId(), FlujoTipo.INGRESO, periodo.getFechaReunion(), nextRecibo, desc, userId);
                }

                // Sincronizar cuotas abonadas
                Set<UUID> cuotasProcesadasIds = cuotasAProcesar.stream().map(CuotaPrestamo::getId).collect(Collectors.toSet());
                opIngreso.getDetalles().removeIf(d ->
                        (Objects.equals(d.getConceptoId(), concCapCobrado.getId()) || Objects.equals(d.getConceptoId(), concIntRecibido.getId()))
                        && (d.getCuotaId() == null || !cuotasProcesadasIds.contains(d.getCuotaId()))
                );

                for (CuotaPrestamo cuota : cuotasAProcesar) {
                    BigDecimal cPag = capPorCuota.getOrDefault(cuota.getId(), BigDecimal.ZERO);
                    BigDecimal iPag = intPorCuota.getOrDefault(cuota.getId(), BigDecimal.ZERO);
                    opIngreso.sincronizarDetalle(concCapCobrado.getId(), cPag, cuota.getPrestamo().getId(), cuota.getId());
                    opIngreso.sincronizarDetalle(concIntRecibido.getId(), iPag, cuota.getPrestamo().getId(), cuota.getId());
                }

                opIngreso.sincronizarDetalle(concAhorro.getId(), ahorro, null, null);
                opIngreso.sincronizarDetalle(concAccion.getId(), acciones, null, null);
                opIngreso.sincronizarDetalle(concTardanza.getId(), tardanza, null, null);
                opIngreso.sincronizarDetalle(concReserva.getId(), reservas, null, null);

                operacionRepository.save(opIngreso);
            } else {
                if (opIngreso != null) {
                    opIngreso.anular(userId, "Sin movimientos en este periodo");
                    operacionRepository.save(opIngreso);
                }
            }
        }

        auditService.registrar(
                cajaId,
                userId,
                UserRole.ADMIN,
                "PLANILLA_ACTUALIZADA",
                "periodo",
                periodoId,
                null,
                Map.of("filasActualizadas", req.filas().size()),
                "127.0.0.1",
                "Internal"
        );

        return obtenerPlanillaMensual(periodoId);
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

    private boolean esCuotaAdelanto(CuotaPrestamo cp, Periodo periodo) {
        if (cp.getFechaVencimiento().getYear() > periodo.getAnio()) {
            return true;
        }
        if (cp.getFechaVencimiento().getYear() == periodo.getAnio() && cp.getFechaVencimiento().getMonthValue() > periodo.getMes()) {
            return true;
        }
        return false;
    }

    private UUID getUserIdActual() {
        UserContext ctx = UserContextHolder.getContext();
        return (ctx != null) ? ctx.userId() : null;
    }
}

