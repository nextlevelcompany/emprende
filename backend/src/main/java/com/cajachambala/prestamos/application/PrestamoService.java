package com.cajachambala.prestamos.application;

import com.cajachambala.caja.domain.*;
import com.cajachambala.caja.infrastructure.persistence.ConceptoRepository;
import com.cajachambala.caja.infrastructure.persistence.OperacionRepository;
import com.cajachambala.caja.infrastructure.persistence.PeriodoRepository;
import com.cajachambala.identidad.domain.UserRole;
import com.cajachambala.identidad.infrastructure.audit.AuditService;
import com.cajachambala.prestamos.application.dto.PrestamoDtos.*;
import com.cajachambala.prestamos.domain.CuotaEstado;
import com.cajachambala.prestamos.domain.CuotaPrestamo;
import com.cajachambala.prestamos.domain.Prestamo;
import com.cajachambala.prestamos.domain.PrestamoEstado;
import com.cajachambala.prestamos.infrastructure.persistence.CuotaPrestamoRepository;
import com.cajachambala.prestamos.infrastructure.persistence.PrestamoRepository;
import com.cajachambala.shared.infrastructure.security.UserContext;
import com.cajachambala.shared.infrastructure.security.UserContextHolder;
import com.cajachambala.socios.domain.Socio;
import com.cajachambala.socios.infrastructure.persistence.SocioRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class PrestamoService {

    private final PrestamoRepository prestamoRepository;
    private final CuotaPrestamoRepository cuotaPrestamoRepository;
    private final SocioRepository socioRepository;
    private final PeriodoRepository periodoRepository;
    private final ConceptoRepository conceptoRepository;
    private final OperacionRepository operacionRepository;
    private final AuditService auditService;

    public PrestamoService(
            PrestamoRepository prestamoRepository,
            CuotaPrestamoRepository cuotaPrestamoRepository,
            SocioRepository socioRepository,
            PeriodoRepository periodoRepository,
            ConceptoRepository conceptoRepository,
            OperacionRepository operacionRepository,
            AuditService auditService
    ) {
        this.prestamoRepository = prestamoRepository;
        this.cuotaPrestamoRepository = cuotaPrestamoRepository;
        this.socioRepository = socioRepository;
        this.periodoRepository = periodoRepository;
        this.conceptoRepository = conceptoRepository;
        this.operacionRepository = operacionRepository;
        this.auditService = auditService;
    }

    // ==========================================
    // 1. Simulación de Préstamo (Proforma)
    // ==========================================

    public SimulacionPrestamoResponse simular(SimularPrestamoRequest req) {
        BigDecimal principal = req.montoPrincipal().setScale(2, RoundingMode.HALF_UP);
        BigDecimal tasa = req.tasaMensual();
        int nroCuotas = req.nroCuotas();

        LocalDate fechaDesembolso = req.fechaDesembolso() != null ? req.fechaDesembolso() : LocalDate.now();
        LocalDate fechaPrimeraCuota = req.fechaPrimeraCuota();
        if (fechaPrimeraCuota == null) {
            LocalDate base = fechaDesembolso.plusMonths(1);
            fechaPrimeraCuota = LocalDate.of(base.getYear(), base.getMonthValue(), Math.min(8, base.lengthOfMonth()));
        }

        if (!fechaPrimeraCuota.isAfter(fechaDesembolso)) {
            throw new IllegalArgumentException("La fecha de primera cuota debe ser posterior a la fecha de desembolso");
        }

        List<CuotaSimuladaResponse> cronograma = generarCronogramaSimulado(principal, tasa, nroCuotas, fechaPrimeraCuota);

        BigDecimal totalInteres = cronograma.stream()
                .map(CuotaSimuladaResponse::interesProgramado)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal totalPagar = principal.add(totalInteres).setScale(2, RoundingMode.HALF_UP);
        BigDecimal tasaPorcentaje = tasa.multiply(BigDecimal.valueOf(100)).setScale(2, RoundingMode.HALF_UP);

        return new SimulacionPrestamoResponse(
                principal,
                tasa,
                tasaPorcentaje,
                nroCuotas,
                totalInteres,
                totalPagar,
                cronograma
        );
    }

    private List<CuotaSimuladaResponse> generarCronogramaSimulado(
            BigDecimal principal,
            BigDecimal tasa,
            int nroCuotas,
            LocalDate fechaPrimeraCuota
    ) {
        List<CuotaSimuladaResponse> cronograma = new ArrayList<>();
        BigDecimal capitalBase = principal.divide(BigDecimal.valueOf(nroCuotas), 2, RoundingMode.HALF_UP);
        BigDecimal capitalAcumulado = BigDecimal.ZERO;
        BigDecimal saldoActual = principal;

        for (int k = 1; k <= nroCuotas; k++) {
            BigDecimal capitalCuota;
            if (k == nroCuotas) {
                // Ajuste exacto de centavos en la última cuota para cuadratura total
                capitalCuota = principal.subtract(capitalAcumulado);
            } else {
                capitalCuota = capitalBase;
            }
            capitalAcumulado = capitalAcumulado.add(capitalCuota);

            BigDecimal interesCuota = saldoActual.multiply(tasa).setScale(2, RoundingMode.HALF_UP);
            BigDecimal cuotaTotal = capitalCuota.add(interesCuota).setScale(2, RoundingMode.HALF_UP);
            BigDecimal saldoRestante = saldoActual.subtract(capitalCuota).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);

            LocalDate fechaVencimiento = fechaPrimeraCuota.plusMonths(k - 1);

            cronograma.add(new CuotaSimuladaResponse(
                    k,
                    fechaVencimiento,
                    capitalCuota,
                    interesCuota,
                    cuotaTotal,
                    saldoRestante
            ));

            saldoActual = saldoRestante;
        }

        return cronograma;
    }

    // ==========================================
    // 2. Solicitud y Registro de Préstamo
    // ==========================================

    @Transactional
    public PrestamoResponse solicitar(SolicitarPrestamoRequest req) {
        UUID cajaId = getCajaIdActual();
        UUID userId = getUserIdActual();

        Socio socio = socioRepository.findByIdAndCajaId(req.socioId(), cajaId)
                .orElseThrow(() -> new IllegalArgumentException("Socio no encontrado en la caja comunal"));

        if (!req.fechaPrimeraCuota().isAfter(req.fechaDesembolso())) {
            throw new IllegalArgumentException("La fecha de primera cuota debe ser posterior a la fecha de desembolso");
        }

        BigDecimal tasa = req.tasaMensual() != null ? req.tasaMensual() : new BigDecimal("0.0500");
        Integer proximoNumero = prestamoRepository.findMaxNumeroByCajaId(cajaId) + 1;

        Prestamo prestamo = new Prestamo(
                cajaId,
                socio.getId(),
                proximoNumero,
                req.montoPrincipal().setScale(2, RoundingMode.HALF_UP),
                tasa.setScale(4, RoundingMode.HALF_UP),
                req.nroCuotas(),
                req.fechaDesembolso(),
                req.fechaPrimeraCuota(),
                req.proposito() != null ? req.proposito().trim() : null,
                userId
        );

        Prestamo guardado = prestamoRepository.save(prestamo);

        auditService.registrar(
                cajaId,
                userId,
                UserRole.ADMIN,
                "PRESTAMO_SOLICITADO",
                "prestamo",
                guardado.getId(),
                null,
                Map.of(
                        "numero", guardado.getNumero().toString(),
                        "socioId", socio.getId().toString(),
                        "monto", guardado.getMontoPrincipal().toString(),
                        "cuotas", guardado.getNroCuotas().toString()
                ),
                "127.0.0.1",
                "Internal"
        );

        return toPrestamoResponse(guardado, socio);
    }

    // ==========================================
    // 3. Aprobación y Rechazo
    // ==========================================

    @Transactional
    public PrestamoResponse aprobar(UUID prestamoId, AprobarPrestamoRequest req) {
        UUID cajaId = getCajaIdActual();
        UUID userId = getUserIdActual();

        Prestamo prestamo = prestamoRepository.findByIdAndCajaId(prestamoId, cajaId)
                .orElseThrow(() -> new IllegalArgumentException("Préstamo no encontrado"));

        prestamo.aprobar(userId);
        Prestamo guardado = prestamoRepository.save(prestamo);
        Socio socio = socioRepository.findByIdAndCajaId(guardado.getSocioId(), cajaId).orElse(null);

        auditService.registrar(
                cajaId,
                userId,
                UserRole.ADMIN,
                "PRESTAMO_APROBADO",
                "prestamo",
                guardado.getId(),
                null,
                Map.of("numero", guardado.getNumero().toString()),
                "127.0.0.1",
                "Internal"
        );

        return toPrestamoResponse(guardado, socio);
    }

    @Transactional
    public PrestamoResponse rechazar(UUID prestamoId, String motivo) {
        UUID cajaId = getCajaIdActual();
        UUID userId = getUserIdActual();

        Prestamo prestamo = prestamoRepository.findByIdAndCajaId(prestamoId, cajaId)
                .orElseThrow(() -> new IllegalArgumentException("Préstamo no encontrado"));

        prestamo.rechazar();
        Prestamo guardado = prestamoRepository.save(prestamo);
        Socio socio = socioRepository.findByIdAndCajaId(guardado.getSocioId(), cajaId).orElse(null);

        auditService.registrar(
                cajaId,
                userId,
                UserRole.ADMIN,
                "PRESTAMO_RECHAZADO",
                "prestamo",
                guardado.getId(),
                null,
                Map.of("numero", guardado.getNumero().toString(), "motivo", motivo != null ? motivo : ""),
                "127.0.0.1",
                "Internal"
        );

        return toPrestamoResponse(guardado, socio);
    }

    // ==========================================
    // 4. Desembolso e Integración con Libro de Caja
    // ==========================================

    @Transactional
    public PrestamoDetalleResponse desembolsar(UUID prestamoId, DesembolsarPrestamoRequest req) {
        UUID cajaId = getCajaIdActual();
        UUID userId = getUserIdActual();

        Prestamo prestamo = prestamoRepository.findByIdAndCajaId(prestamoId, cajaId)
                .orElseThrow(() -> new IllegalArgumentException("Préstamo no encontrado"));

        if (prestamo.getEstado() != PrestamoEstado.APROBADO && prestamo.getEstado() != PrestamoEstado.SOLICITADO) {
            throw new IllegalStateException("El préstamo ya se encuentra desembolsado o en estado " + prestamo.getEstado());
        }

        Periodo periodo = periodoRepository.findByIdAndCajaId(req.periodoId(), cajaId)
                .orElseThrow(() -> new IllegalArgumentException("Periodo contable no encontrado"));

        if (periodo.getEstado() == PeriodoEstado.CERRADO) {
            throw new IllegalStateException("El periodo contable seleccionado está cerrado. No se puede desembolsar en un mes cerrado.");
        }

        Socio socio = socioRepository.findByIdAndCajaId(prestamo.getSocioId(), cajaId)
                .orElseThrow(() -> new IllegalArgumentException("Socio titular no encontrado"));

        LocalDate fechaDesembolsoEfectiva = req.fechaDesembolso() != null ? req.fechaDesembolso() : periodo.getFechaReunion();

        // 1. Generar Cronograma de Pagos Oficial
        List<CuotaSimuladaResponse> simuladas = generarCronogramaSimulado(
                prestamo.getMontoPrincipal(),
                prestamo.getTasaMensual(),
                prestamo.getNroCuotas(),
                prestamo.getFechaPrimeraCuota()
        );

        for (CuotaSimuladaResponse sim : simuladas) {
            CuotaPrestamo cuota = new CuotaPrestamo(
                    prestamo,
                    sim.nroCuota().shortValue(),
                    sim.fechaVencimiento(),
                    sim.capitalProgramado(),
                    sim.interesProgramado()
            );
            prestamo.agregarCuota(cuota);
        }

        // 2. Actualizar estado del Préstamo a VIGENTE
        prestamo.desembolsar(fechaDesembolsoEfectiva);
        Prestamo guardado = prestamoRepository.save(prestamo);

        // 3. Crear Operación Contable de EGRESO en el Libro de Caja
        Concepto conceptoPrestamo = conceptoRepository.findByCodigo("PRESTAMO")
                .orElseThrow(() -> new IllegalStateException("Concepto 'PRESTAMO' no está configurado en el catálogo contable"));

        Operacion egresoDesembolso = new Operacion(
                cajaId,
                periodo.getId(),
                socio.getId(),
                FlujoTipo.EGRESO,
                fechaDesembolsoEfectiva,
                null,
                "Desembolso de Préstamo #" + guardado.getNumero() + " a " + socio.getNombreCompleto(),
                userId
        );

        egresoDesembolso.agregarDetalle(
                conceptoPrestamo.getId(),
                guardado.getMontoPrincipal(),
                guardado.getId(),
                null
        );

        operacionRepository.save(egresoDesembolso);

        // 4. Auditoría
        auditService.registrar(
                cajaId,
                userId,
                UserRole.ADMIN,
                "PRESTAMO_DESEMBOLSADO",
                "prestamo",
                guardado.getId(),
                null,
                Map.of(
                        "numero", guardado.getNumero().toString(),
                        "monto", guardado.getMontoPrincipal().toString(),
                        "periodoId", periodo.getId().toString(),
                        "egresoId", egresoDesembolso.getId().toString()
                ),
                "127.0.0.1",
                "Internal"
        );

        return toPrestamoDetalleResponse(guardado, socio);
    }

    // ==========================================
    // 5. Cobranzas y Registro de Pagos de Cuotas
    // ==========================================

    @Transactional
    public PrestamoDetalleResponse registrarPagoCuota(
            UUID prestamoId,
            UUID cuotaId,
            RegistrarPagoCuotaRequest req
    ) {
        UUID cajaId = getCajaIdActual();
        UUID userId = getUserIdActual();

        Prestamo prestamo = prestamoRepository.findByIdAndCajaId(prestamoId, cajaId)
                .orElseThrow(() -> new IllegalArgumentException("Préstamo no encontrado"));

        if (prestamo.getEstado() != PrestamoEstado.VIGENTE) {
            throw new IllegalStateException("Solo se pueden cobrar cuotas de préstamos en estado VIGENTE (actual: " + prestamo.getEstado() + ")");
        }

        CuotaPrestamo cuota = cuotaPrestamoRepository.findByIdAndPrestamoId(cuotaId, prestamoId)
                .orElseThrow(() -> new IllegalArgumentException("Cuota no encontrada en este préstamo"));

        if (cuota.getEstado() == CuotaEstado.PAGADA) {
            throw new IllegalStateException("La cuota #" + cuota.getNroCuota() + " ya está completamente pagada");
        }

        Periodo periodo = periodoRepository.findByIdAndCajaId(req.periodoId(), cajaId)
                .orElseThrow(() -> new IllegalArgumentException("Periodo contable no encontrado"));

        if (periodo.getEstado() == PeriodoEstado.CERRADO) {
            throw new IllegalStateException("El periodo contable está cerrado. No se pueden registrar cobros en un mes cerrado.");
        }

        Socio socio = socioRepository.findByIdAndCajaId(prestamo.getSocioId(), cajaId)
                .orElseThrow(() -> new IllegalArgumentException("Socio no encontrado"));

        BigDecimal abonoCapital = req.montoCapital().setScale(2, RoundingMode.HALF_UP);
        BigDecimal abonoInteres = req.montoInteres().setScale(2, RoundingMode.HALF_UP);
        BigDecimal abonoMora = req.montoMora() != null ? req.montoMora().setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO.setScale(2);

        BigDecimal totalCobrado = abonoCapital.add(abonoInteres).add(abonoMora);
        if (totalCobrado.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("El total a cobrar debe ser mayor a S/. 0.00");
        }

        LocalDate fechaPago = req.fechaPago() != null ? req.fechaPago() : periodo.getFechaReunion();

        // 1. Abonar a la cuota
        cuota.abonar(abonoCapital, abonoInteres, abonoMora, fechaPago);
        cuotaPrestamoRepository.save(cuota);

        // 2. Verificar si el préstamo se canceló en su totalidad
        prestamo.verificarCancelacionTotal();
        Prestamo guardado = prestamoRepository.save(prestamo);

        // 3. Crear Operación Contable de INGRESO en el Libro de Caja
        Concepto conceptoCapital = conceptoRepository.findByCodigo("PAGO_CAPITAL")
                .orElseThrow(() -> new IllegalStateException("Concepto 'PAGO_CAPITAL' no encontrado"));
        Concepto conceptoInteres = conceptoRepository.findByCodigo("INTERES_RECIBIDO")
                .orElseThrow(() -> new IllegalStateException("Concepto 'INTERES_RECIBIDO' no encontrado"));

        Integer nroRecibo = operacionRepository.findMaxNroReciboByCajaId(cajaId) + 1;

        String descripcion = "Cobro cuota " + cuota.getNroCuota() + "/" + guardado.getNroCuotas() +
                " Préstamo #" + guardado.getNumero() + " - " + socio.getNombreCompleto();
        if (req.observacion() != null && !req.observacion().isBlank()) {
            descripcion += " (" + req.observacion().trim() + ")";
        }

        Operacion ingresoCobranza = new Operacion(
                cajaId,
                periodo.getId(),
                socio.getId(),
                FlujoTipo.INGRESO,
                fechaPago,
                nroRecibo,
                descripcion,
                userId
        );

        if (abonoCapital.compareTo(BigDecimal.ZERO) > 0) {
            ingresoCobranza.agregarDetalle(
                    conceptoCapital.getId(),
                    abonoCapital,
                    guardado.getId(),
                    cuota.getId()
            );
        }

        if (abonoInteres.compareTo(BigDecimal.ZERO) > 0) {
            ingresoCobranza.agregarDetalle(
                    conceptoInteres.getId(),
                    abonoInteres,
                    guardado.getId(),
                    cuota.getId()
            );
        }

        if (abonoMora.compareTo(BigDecimal.ZERO) > 0) {
            Optional<Concepto> conceptoMora = conceptoRepository.findByCodigo("MULTA_TARDANZA");
            if (conceptoMora.isPresent()) {
                ingresoCobranza.agregarDetalle(
                        conceptoMora.get().getId(),
                        abonoMora,
                        guardado.getId(),
                        cuota.getId()
                );
            }
        }

        operacionRepository.save(ingresoCobranza);

        // 4. Auditoría
        auditService.registrar(
                cajaId,
                userId,
                UserRole.ADMIN,
                "CUOTA_COBRADA",
                "cuota_prestamo",
                cuota.getId(),
                null,
                Map.of(
                        "prestamoNumero", guardado.getNumero().toString(),
                        "nroCuota", cuota.getNroCuota().toString(),
                        "capitalPagado", abonoCapital.toString(),
                        "interesPagado", abonoInteres.toString(),
                        "ingresoId", ingresoCobranza.getId().toString()
                ),
                "127.0.0.1",
                "Internal"
        );

        return toPrestamoDetalleResponse(guardado, socio);
    }

    // ==========================================
    // 6. Consultas y Reportes
    // ==========================================

    @Transactional(readOnly = true)
    public PrestamoDetalleResponse obtenerDetalle(UUID prestamoId) {
        UUID cajaId = getCajaIdActual();
        Prestamo prestamo = prestamoRepository.findByIdAndCajaId(prestamoId, cajaId)
                .orElseThrow(() -> new IllegalArgumentException("Préstamo no encontrado"));

        Socio socio = socioRepository.findByIdAndCajaId(prestamo.getSocioId(), cajaId).orElse(null);
        return toPrestamoDetalleResponse(prestamo, socio);
    }

    @Transactional(readOnly = true)
    public Page<PrestamoResponse> listar(UUID socioId, PrestamoEstado estado, Pageable pageable) {
        UUID cajaId = getCajaIdActual();

        Specification<Prestamo> spec = (root, query, cb) -> {
            var predicates = new ArrayList<jakarta.persistence.criteria.Predicate>();
            predicates.add(cb.equal(root.get("cajaId"), cajaId));

            if (socioId != null) {
                predicates.add(cb.equal(root.get("socioId"), socioId));
            }
            if (estado != null) {
                predicates.add(cb.equal(root.get("estado"), estado));
            }

            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };

        Page<Prestamo> page = prestamoRepository.findAll(spec, pageable);

        // Obtener mapa de socios
        Set<UUID> socioIds = page.getContent().stream().map(Prestamo::getSocioId).collect(Collectors.toSet());
        Map<UUID, Socio> sociosMap = socioRepository.findAllById(socioIds).stream()
                .collect(Collectors.toMap(Socio::getId, s -> s));

        return page.map(p -> toPrestamoResponse(p, sociosMap.get(p.getSocioId())));
    }

    @Transactional(readOnly = true)
    public ResumenCarteraResponse obtenerResumenCartera() {
        UUID cajaId = getCajaIdActual();
        List<Prestamo> todos = prestamoRepository.findAll((root, query, cb) -> cb.equal(root.get("cajaId"), cajaId));

        long vigentes = todos.stream().filter(p -> p.getEstado() == PrestamoEstado.VIGENTE).count();
        long cancelados = todos.stream().filter(p -> p.getEstado() == PrestamoEstado.CANCELADO).count();
        long solicitados = todos.stream().filter(p -> p.getEstado() == PrestamoEstado.SOLICITADO).count();

        BigDecimal saldoCapitalColocado = BigDecimal.ZERO;
        BigDecimal totalCapitalCobrado = BigDecimal.ZERO;
        BigDecimal totalInteresesGanados = BigDecimal.ZERO;
        long cuotasVencidasTotal = 0;

        for (Prestamo p : todos) {
            for (CuotaPrestamo c : p.getCuotas()) {
                totalCapitalCobrado = totalCapitalCobrado.add(c.getCapitalPagado());
                totalInteresesGanados = totalInteresesGanados.add(c.getInteresPagado());
                if (c.getEstado() == CuotaEstado.VENCIDA) {
                    cuotasVencidasTotal++;
                }
            }
            if (p.getEstado() == PrestamoEstado.VIGENTE) {
                BigDecimal pagadoEnP = p.getCuotas().stream()
                        .map(CuotaPrestamo::getCapitalPagado)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                saldoCapitalColocado = saldoCapitalColocado.add(p.getMontoPrincipal().subtract(pagadoEnP));
            }
        }

        return new ResumenCarteraResponse(
                todos.size(),
                vigentes,
                cancelados,
                solicitados,
                saldoCapitalColocado.setScale(2, RoundingMode.HALF_UP),
                totalCapitalCobrado.setScale(2, RoundingMode.HALF_UP),
                totalInteresesGanados.setScale(2, RoundingMode.HALF_UP),
                cuotasVencidasTotal
        );
    }

    // ==========================================
    // Mapeadores Auxiliares
    // ==========================================

    private PrestamoResponse toPrestamoResponse(Prestamo p, Socio s) {
        BigDecimal capitalPagado = BigDecimal.ZERO;
        BigDecimal interesPagado = BigDecimal.ZERO;
        int cuotasPagadas = 0;
        int cuotasVencidas = 0;

        if (p.getCuotas() != null) {
            for (CuotaPrestamo c : p.getCuotas()) {
                capitalPagado = capitalPagado.add(c.getCapitalPagado());
                interesPagado = interesPagado.add(c.getInteresPagado());
                if (c.getEstado() == CuotaEstado.PAGADA) {
                    cuotasPagadas++;
                } else if (c.getEstado() == CuotaEstado.VENCIDA) {
                    cuotasVencidas++;
                }
            }
        }

        BigDecimal saldoCapital = p.getMontoPrincipal().subtract(capitalPagado).max(BigDecimal.ZERO);

        return new PrestamoResponse(
                p.getId(),
                p.getCajaId(),
                p.getSocioId(),
                s != null ? s.getCodigo() : null,
                s != null ? s.getNombreCompleto() : "Socio #" + p.getSocioId(),
                s != null ? s.getDocumentoTipo() : "-",
                p.getNumero(),
                p.getMontoPrincipal(),
                p.getTasaMensual(),
                p.getNroCuotas(),
                p.getMetodoAmortizacion(),
                p.getFechaDesembolso(),
                p.getFechaPrimeraCuota(),
                p.getEstado(),
                p.getProposito(),
                capitalPagado.setScale(2, RoundingMode.HALF_UP),
                saldoCapital.setScale(2, RoundingMode.HALF_UP),
                interesPagado.setScale(2, RoundingMode.HALF_UP),
                cuotasPagadas,
                cuotasVencidas,
                p.getCreatedAt(),
                p.getUpdatedAt()
        );
    }

    private PrestamoDetalleResponse toPrestamoDetalleResponse(Prestamo p, Socio s) {
        PrestamoResponse cabecera = toPrestamoResponse(p, s);

        List<CuotaPrestamoResponse> cronograma = p.getCuotas().stream()
                .map(c -> new CuotaPrestamoResponse(
                        c.getId(),
                        c.getNroCuota(),
                        c.getFechaVencimiento(),
                        c.getCapitalProgramado(),
                        c.getInteresProgramado(),
                        c.getCuotaProgramada(),
                        c.getCapitalPagado(),
                        c.getInteresPagado(),
                        c.getMoraPagada(),
                        c.getSaldoCapitalPendiente(),
                        c.getSaldoInteresPendiente(),
                        c.getTotalPendiente(),
                        c.getEstado(),
                        c.getFechaPago(),
                        c.getUpdatedAt()
                ))
                .sorted(Comparator.comparing(CuotaPrestamoResponse::nroCuota))
                .collect(Collectors.toList());

        return new PrestamoDetalleResponse(cabecera, cronograma);
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
