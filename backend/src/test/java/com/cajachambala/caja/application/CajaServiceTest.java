package com.cajachambala.caja.application;

import com.cajachambala.caja.application.dto.CajaDtos.*;
import com.cajachambala.caja.domain.*;
import com.cajachambala.caja.infrastructure.persistence.*;
import com.cajachambala.identidad.infrastructure.audit.AuditService;
import com.cajachambala.shared.infrastructure.security.UserContext;
import com.cajachambala.shared.infrastructure.security.UserContextHolder;
import com.cajachambala.prestamos.domain.CuotaEstado;
import com.cajachambala.prestamos.domain.CuotaPrestamo;
import com.cajachambala.prestamos.domain.Prestamo;
import com.cajachambala.prestamos.infrastructure.persistence.CuotaPrestamoRepository;
import com.cajachambala.prestamos.infrastructure.persistence.PrestamoRepository;
import com.cajachambala.socios.domain.Socio;
import com.cajachambala.socios.domain.SocioEstado;
import com.cajachambala.socios.domain.SocioTipo;
import com.cajachambala.socios.infrastructure.persistence.SocioRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CajaServiceTest {

    @Mock
    private PeriodoRepository periodoRepository;

    @Mock
    private ConceptoRepository conceptoRepository;

    @Mock
    private OperacionRepository operacionRepository;

    @Mock
    private CierrePeriodoRepository cierrePeriodoRepository;

    @Mock
    private ArqueoCajaRepository arqueoCajaRepository;

    @Mock
    private SocioRepository socioRepository;

    @Mock
    private PrestamoRepository prestamoRepository;

    @Mock
    private CuotaPrestamoRepository cuotaPrestamoRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private CajaService cajaService;

    private final UUID cajaId = UUID.fromString("a0000000-0000-0000-0000-000000000001");
    private final UUID userId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        UserContextHolder.setContext(new UserContext(userId, cajaId, "ADMIN", null, "admin@cajachambala.pe"));
    }

    @AfterEach
    void tearDown() {
        UserContextHolder.clear();
    }

    @Test
    @DisplayName("Debe crear un periodo contable asignando por defecto el día 8 de reunión")
    void debeCrearPeriodoExitosamente() {
        CrearPeriodoRequest req = new CrearPeriodoRequest((short) 2024, (short) 6, null);

        when(periodoRepository.findByCajaIdAndAnioAndMes(cajaId, (short) 2024, (short) 6)).thenReturn(Optional.empty());
        when(periodoRepository.save(any(Periodo.class))).thenAnswer(inv -> inv.getArgument(0));
        when(periodoRepository.findByCajaIdOrderByAnioDescMesDesc(cajaId)).thenReturn(Collections.emptyList());

        PeriodoResponse resp = cajaService.crearPeriodo(req);

        assertThat(resp).isNotNull();
        assertThat(resp.anio()).isEqualTo((short) 2024);
        assertThat(resp.mes()).isEqualTo((short) 6);
        assertThat(resp.fechaReunion()).isEqualTo(LocalDate.of(2024, 6, 8));
        assertThat(resp.estado()).isEqualTo(PeriodoEstado.ABIERTO);

        verify(periodoRepository).save(any(Periodo.class));
        verify(auditService).registrar(eq(cajaId), eq(userId), any(), eq("PERIODO_CREADO"), eq("periodo"), any(), isNull(), any(), any(), any());
    }

    @Test
    @DisplayName("Debe rechazar creación de periodo si ya existe para ese año y mes")
    void debeRechazarPeriodoDuplicado() {
        CrearPeriodoRequest req = new CrearPeriodoRequest((short) 2024, (short) 6, null);
        Periodo existente = new Periodo(cajaId, (short) 2024, (short) 6, LocalDate.of(2024, 6, 8));

        when(periodoRepository.findByCajaIdAndAnioAndMes(cajaId, (short) 2024, (short) 6)).thenReturn(Optional.of(existente));

        assertThatThrownBy(() -> cajaService.crearPeriodo(req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Ya existe un periodo");

        verify(periodoRepository, never()).save(any());
    }

    @Test
    @DisplayName("Debe registrar una operación de ingreso con recibo autoincremental")
    void debeRegistrarOperacionIngreso() {
        UUID periodoId = UUID.randomUUID();
        UUID socioId = UUID.randomUUID();
        Periodo periodo = new Periodo(cajaId, (short) 2024, (short) 6, LocalDate.of(2024, 6, 8));

        Socio socio = new Socio(cajaId, 1, SocioTipo.SOCIO, "Juan", "Pérez", "DNI", "enc".getBytes(), "hash", null, null, null, LocalDate.now(), userId);
        Concepto concAhorro = new Concepto("DEPOSITO_AHORRO", "Depósito de ahorros", FlujoTipo.INGRESO, true, (short) 1);

        when(periodoRepository.findByIdAndCajaId(periodoId, cajaId)).thenReturn(Optional.of(periodo));
        when(socioRepository.findByIdAndCajaId(socioId, cajaId)).thenReturn(Optional.of(socio));
        when(conceptoRepository.findById((short) 1)).thenReturn(Optional.of(concAhorro));
        when(operacionRepository.findMaxNroReciboByCajaId(cajaId)).thenReturn(100);
        when(operacionRepository.save(any(Operacion.class))).thenAnswer(inv -> inv.getArgument(0));

        RegistrarOperacionRequest req = new RegistrarOperacionRequest(
                socioId,
                FlujoTipo.INGRESO,
                LocalDate.of(2024, 6, 8),
                null, // Autoincrementar
                "Aporte mensual",
                List.of(new DetalleOperacionRequest((short) 1, new BigDecimal("50.00"), null, null))
        );

        OperacionResponse resp = cajaService.registrarOperacion(periodoId, req);

        assertThat(resp).isNotNull();
        assertThat(resp.nroRecibo()).isEqualTo(101);
        assertThat(resp.total()).isEqualByComparingTo(new BigDecimal("50.00"));
        assertThat(resp.estado()).isEqualTo(OperacionEstado.VIGENTE);

        verify(operacionRepository).save(any(Operacion.class));
        verify(auditService).registrar(eq(cajaId), eq(userId), any(), eq("OPERACION_REGISTRADA"), eq("operacion"), any(), isNull(), any(), any(), any());
    }

    @Test
    @DisplayName("Debe rechazar registrar operaciones en un periodo cerrado")
    void debeRechazarOperacionEnPeriodoCerrado() {
        UUID periodoId = UUID.randomUUID();
        Periodo periodo = new Periodo(cajaId, (short) 2024, (short) 6, LocalDate.of(2024, 6, 8));
        periodo.cerrar(userId);

        when(periodoRepository.findByIdAndCajaId(periodoId, cajaId)).thenReturn(Optional.of(periodo));

        RegistrarOperacionRequest req = new RegistrarOperacionRequest(
                UUID.randomUUID(),
                FlujoTipo.INGRESO,
                LocalDate.of(2024, 6, 8),
                102,
                "Intento",
                List.of(new DetalleOperacionRequest((short) 1, new BigDecimal("10.00"), null, null))
        );

        assertThatThrownBy(() -> cajaService.registrarOperacion(periodoId, req))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("El periodo está cerrado");

        verify(operacionRepository, never()).save(any());
    }

    @Test
    @DisplayName("Debe anular una operación de forma lógica sin DELETE físico")
    void debeAnularOperacionExitosamente() {
        UUID operacionId = UUID.randomUUID();
        UUID periodoId = UUID.randomUUID();
        Periodo periodo = new Periodo(cajaId, (short) 2024, (short) 6, LocalDate.of(2024, 6, 8));

        Operacion op = new Operacion(cajaId, periodoId, null, FlujoTipo.EGRESO, LocalDate.now(), null, "Gasto luz", userId);

        when(operacionRepository.findByIdAndCajaId(operacionId, cajaId)).thenReturn(Optional.of(op));
        when(periodoRepository.findByIdAndCajaId(periodoId, cajaId)).thenReturn(Optional.of(periodo));
        when(operacionRepository.save(any(Operacion.class))).thenAnswer(inv -> inv.getArgument(0));

        AnularOperacionRequest req = new AnularOperacionRequest("Comprobante duplicado por error");
        OperacionResponse resp = cajaService.anularOperacion(operacionId, req);

        assertThat(resp.estado()).isEqualTo(OperacionEstado.ANULADA);
        assertThat(resp.motivoAnulacion()).isEqualTo("Comprobante duplicado por error");
        assertThat(resp.anuladoAt()).isNotNull();

        verify(auditService).registrar(eq(cajaId), eq(userId), any(), eq("OPERACION_ANULADA"), eq("operacion"), any(), isNull(), any(), any(), any());
    }

    @Test
    @DisplayName("Debe registrar arqueo de caja calculando diferencia frente al saldo del sistema")
    void debeRegistrarArqueoDeCaja() {
        UUID periodoId = UUID.randomUUID();
        Periodo periodo = new Periodo(cajaId, (short) 2024, (short) 6, LocalDate.of(2024, 6, 8));

        when(periodoRepository.findByIdAndCajaId(periodoId, cajaId)).thenReturn(Optional.of(periodo));
        when(periodoRepository.findByCajaIdOrderByAnioDescMesDesc(cajaId)).thenReturn(List.of(periodo));
        when(operacionRepository.findByCajaIdAndPeriodoIdAndEstadoOrderByFechaAscNroReciboAsc(cajaId, periodoId, OperacionEstado.VIGENTE))
                .thenReturn(Collections.emptyList());
        when(arqueoCajaRepository.findById(periodoId)).thenReturn(Optional.empty());
        when(arqueoCajaRepository.save(any(ArqueoCaja.class))).thenAnswer(inv -> inv.getArgument(0));

        // Saldo sistema es 0.00. Efectivo contado S/. 150.00 + Banco S/. 50.00 = S/. 200.00 -> Sobrante S/. 200.00
        RegistrarArqueoRequest req = new RegistrarArqueoRequest(new BigDecimal("150.00"), new BigDecimal("50.00"), "Conforme");
        ArqueoResponse resp = cajaService.registrarArqueo(periodoId, req);

        assertThat(resp).isNotNull();
        assertThat(resp.totalContado()).isEqualByComparingTo(new BigDecimal("200.00"));
        assertThat(resp.saldoSistema()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(resp.diferencia()).isEqualByComparingTo(new BigDecimal("200.00"));

        verify(arqueoCajaRepository).save(any(ArqueoCaja.class));
        verify(auditService).registrar(eq(cajaId), eq(userId), any(), eq("ARQUEO_REGISTRADO"), eq("arqueo_caja"), any(), isNull(), any(), any(), any());
    }

    @Test
    @DisplayName("Debe cerrar un periodo generando snapshot inmutable y hash SHA-256 de 64 caracteres")
    void debeCerrarPeriodoGenerandoHash() {
        UUID periodoId = UUID.randomUUID();
        Periodo periodo = new Periodo(cajaId, (short) 2024, (short) 6, LocalDate.of(2024, 6, 8));

        when(periodoRepository.findByIdAndCajaId(periodoId, cajaId)).thenReturn(Optional.of(periodo));
        when(periodoRepository.findByCajaIdOrderByAnioDescMesDesc(cajaId)).thenReturn(List.of(periodo));
        when(operacionRepository.findByCajaIdAndPeriodoIdAndEstadoOrderByFechaAscNroReciboAsc(cajaId, periodoId, OperacionEstado.VIGENTE))
                .thenReturn(Collections.emptyList());
        when(cierrePeriodoRepository.save(any(CierrePeriodo.class))).thenAnswer(inv -> inv.getArgument(0));
        when(periodoRepository.save(any(Periodo.class))).thenAnswer(inv -> inv.getArgument(0));

        CierrePeriodoResponse resp = cajaService.cerrarPeriodo(periodoId);

        assertThat(resp).isNotNull();
        assertThat(resp.hashIntegridad()).hasSize(64);
        assertThat(periodo.getEstado()).isEqualTo(PeriodoEstado.CERRADO);

        verify(cierrePeriodoRepository).save(any(CierrePeriodo.class));
        verify(periodoRepository).save(periodo);
        verify(auditService).registrar(eq(cajaId), eq(userId), any(), eq("PERIODO_CERRADO"), eq("periodo"), any(), isNull(), any(), any(), any());
    }

    @Test
    @DisplayName("Debe reabrir un periodo cerrado eliminando el snapshot de cierre y auditando el motivo")
    void debeReabrirPeriodoExitosamente() {
        UUID periodoId = UUID.randomUUID();
        Periodo periodo = new Periodo(cajaId, (short) 2024, (short) 6, LocalDate.of(2024, 6, 8));
        periodo.cerrar(userId);

        when(periodoRepository.findByIdAndCajaId(periodoId, cajaId)).thenReturn(Optional.of(periodo));
        when(periodoRepository.save(any(Periodo.class))).thenAnswer(inv -> inv.getArgument(0));

        ReabrirPeriodoRequest req = new ReabrirPeriodoRequest("Ajuste de recibo mal imputado");
        PeriodoResponse resp = cajaService.reabrirPeriodo(periodoId, req);

        assertThat(resp.estado()).isEqualTo(PeriodoEstado.ABIERTO);
        assertThat(periodo.getEstado()).isEqualTo(PeriodoEstado.ABIERTO);

        verify(cierrePeriodoRepository).deleteById(periodoId);
        verify(auditService).registrar(eq(cajaId), eq(userId), any(), eq("PERIODO_REABIERTO"), eq("periodo"), any(), isNull(), any(), any(), any());
    }

    @Test
    @DisplayName("Debe generar la planilla mensual estilo Excel calculando las 14 columnas y totales")
    void debeGenerarPlanillaMensual() {
        UUID periodoId = UUID.randomUUID();
        Periodo periodo = new Periodo(cajaId, (short) 2024, (short) 6, LocalDate.of(2024, 6, 8));

        Socio socio = new Socio(cajaId, 1, SocioTipo.SOCIO, "Carlos", "Alvarez", "DNI", "enc".getBytes(), "hash", null, null, null, LocalDate.now(), userId);
        UUID socioId = socio.getId();
        Concepto concAhorro = new Concepto((short) 1, "DEPOSITO_AHORRO", "Depósito de ahorros", FlujoTipo.INGRESO, true, (short) 1);
        Concepto concPrestamo = new Concepto((short) 2, "PRESTAMO", "Préstamos", FlujoTipo.EGRESO, true, (short) 2);

        Operacion opIngreso = new Operacion(cajaId, periodoId, socioId, FlujoTipo.INGRESO, LocalDate.of(2024, 6, 8), 10, "Ahorro", userId);
        opIngreso.agregarDetalle((short) 1, new BigDecimal("100.00"));

        Operacion opEgreso = new Operacion(cajaId, periodoId, socioId, FlujoTipo.EGRESO, LocalDate.of(2024, 6, 8), null, "Préstamo", userId);
        opEgreso.agregarDetalle((short) 2, new BigDecimal("500.00"));

        when(periodoRepository.findByIdAndCajaId(periodoId, cajaId)).thenReturn(Optional.of(periodo));
        when(periodoRepository.findByCajaIdOrderByAnioDescMesDesc(cajaId)).thenReturn(List.of(periodo));
        when(operacionRepository.findByCajaIdAndPeriodoIdAndEstadoOrderByFechaAscNroReciboAsc(cajaId, periodoId, OperacionEstado.VIGENTE))
                .thenReturn(List.of(opIngreso, opEgreso));
        when(socioRepository.findByCajaIdAndDeletedAtIsNullOrderByCodigoAsc(cajaId)).thenReturn(List.of(socio));
        when(conceptoRepository.findAll()).thenReturn(List.of(concAhorro, concPrestamo));
        when(cuotaPrestamoRepository.findPendientesVigentesPorCaja(cajaId)).thenReturn(Collections.emptyList());

        PlanillaMensualResponse planilla = cajaService.obtenerPlanillaMensual(periodoId);

        assertThat(planilla).isNotNull();
        assertThat(planilla.filas()).hasSize(1);
        FilaPlanillaMensual fila = planilla.filas().get(0);
        assertThat(fila.socioCodigo()).isEqualTo(1);
        assertThat(fila.ahorro()).isEqualByComparingTo(new BigDecimal("100.00"));
        assertThat(fila.totalIngreso()).isEqualByComparingTo(new BigDecimal("100.00"));
        assertThat(fila.prestamo()).isEqualByComparingTo(new BigDecimal("500.00"));
        assertThat(fila.totalEgreso()).isEqualByComparingTo(new BigDecimal("500.00"));

        assertThat(planilla.totalIngresosMes()).isEqualByComparingTo(new BigDecimal("100.00"));
        assertThat(planilla.totalEgresosMes()).isEqualByComparingTo(new BigDecimal("500.00"));
        assertThat(planilla.saldoFinal()).isEqualByComparingTo(new BigDecimal("-400.00"));
    }

    @Test
    @DisplayName("Debe guardar planilla distribuyendo el pago consolidado entre múltiples préstamos del socio")
    void debeGuardarPlanillaDistribuyendoCuotasDeMultiplesPrestamos() {
        UUID periodoId = UUID.randomUUID();
        LocalDate fecha = LocalDate.of(2026, 10, 8);
        Periodo periodo = new Periodo(cajaId, (short) 2026, (short) 10, fecha);

        Socio socio = new Socio(cajaId, 15, SocioTipo.SOCIO, "MIRTHA ROSA", "ALANYA HUAMAN", "DNI", "enc".getBytes(), "hash", null, null, null, LocalDate.now(), userId);
        UUID socioId = socio.getId();

        Concepto concAccion = new Concepto((short) 1, "ACCION", "Acción", FlujoTipo.INGRESO, true, (short) 1);
        Concepto concCapCobrado = new Concepto((short) 2, "PAGO_CAPITAL", "Pago Capital", FlujoTipo.INGRESO, true, (short) 2);
        Concepto concIntRecibido = new Concepto((short) 3, "INTERES_RECIBIDO", "Interés Recibido", FlujoTipo.INGRESO, true, (short) 3);
        Concepto concAhorro = new Concepto((short) 4, "DEPOSITO_AHORRO", "Depósito Ahorro", FlujoTipo.INGRESO, true, (short) 4);
        Concepto concTardanza = new Concepto((short) 5, "MULTA_TARDANZA", "Tardanza", FlujoTipo.INGRESO, true, (short) 5);
        Concepto concReserva = new Concepto((short) 6, "RESERVA", "Reserva", FlujoTipo.INGRESO, true, (short) 6);

        Prestamo p70 = new Prestamo(cajaId, socioId, 70, new BigDecimal("11849.78"), new BigDecimal("0.03"), (short) 12, LocalDate.of(2026, 7, 8), LocalDate.of(2026, 8, 8), "Crédito 70", userId);
        CuotaPrestamo c70 = new CuotaPrestamo(p70, (short) 3, fecha, new BigDecimal("987.48"), new BigDecimal("296.24"));
        p70.agregarCuota(c70);

        Prestamo p72 = new Prestamo(cajaId, socioId, 72, new BigDecimal("8156.92"), new BigDecimal("0.03"), (short) 11, LocalDate.of(2026, 8, 8), LocalDate.of(2026, 9, 8), "Crédito 72", userId);
        CuotaPrestamo c72 = new CuotaPrestamo(p72, (short) 2, fecha, new BigDecimal("741.54"), new BigDecimal("222.46"));
        p72.agregarCuota(c72);

        when(periodoRepository.findByIdAndCajaId(periodoId, cajaId)).thenReturn(Optional.of(periodo));
        when(conceptoRepository.findByCodigo("ACCION")).thenReturn(Optional.of(concAccion));
        when(conceptoRepository.findByCodigo("PAGO_CAPITAL")).thenReturn(Optional.of(concCapCobrado));
        when(conceptoRepository.findByCodigo("INTERES_RECIBIDO")).thenReturn(Optional.of(concIntRecibido));
        when(conceptoRepository.findByCodigo("DEPOSITO_AHORRO")).thenReturn(Optional.of(concAhorro));
        when(conceptoRepository.findByCodigo("MULTA_TARDANZA")).thenReturn(Optional.of(concTardanza));
        when(conceptoRepository.findByCodigo("RESERVA")).thenReturn(Optional.of(concReserva));

        when(operacionRepository.findByCajaIdAndPeriodoIdAndEstadoOrderByFechaAscNroReciboAsc(cajaId, periodoId, OperacionEstado.VIGENTE))
                .thenReturn(Collections.emptyList());
        when(socioRepository.findByIdAndCajaId(socioId, cajaId)).thenReturn(Optional.of(socio));

        when(cuotaPrestamoRepository.findPendientesVigentesPorSocio(cajaId, socioId))
                .thenReturn(List.of(c70, c72));

        // Para el retorno de obtenerPlanillaMensual
        when(socioRepository.findByCajaIdAndDeletedAtIsNullOrderByCodigoAsc(cajaId)).thenReturn(List.of(socio));
        when(conceptoRepository.findAll()).thenReturn(List.of(concAccion, concCapCobrado, concIntRecibido));
        when(cuotaPrestamoRepository.findPendientesVigentesPorCaja(cajaId)).thenReturn(Collections.emptyList());
        when(periodoRepository.findByCajaIdOrderByAnioDescMesDesc(cajaId)).thenReturn(List.of(periodo));

        GuardarFilaPlanillaRequest filaReq = new GuardarFilaPlanillaRequest(
                socioId,
                BigDecimal.ZERO,
                new BigDecimal("1729.02"), // Suma de capital de p70 y p72
                new BigDecimal("518.70"),  // Suma de interés de p70 y p72
                new BigDecimal("30.00"),
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                true,
                true,
                c72.getId(), // Puede venir el ID de una sola cuota desde la grilla
                p72.getId()
        );

        PlanillaMensualResponse resp = cajaService.guardarPlanilla(periodoId, new GuardarPlanillaRequest(List.of(filaReq)));

        assertThat(resp).isNotNull();
        // Verificar que ambas cuotas quedaron pagadas sin superar sus topes programados
        assertThat(c70.getCapitalPagado()).isEqualByComparingTo(new BigDecimal("987.48"));
        assertThat(c70.getInteresPagado()).isEqualByComparingTo(new BigDecimal("296.24"));
        assertThat(c70.getEstado()).isEqualTo(CuotaEstado.PAGADA);

        assertThat(c72.getCapitalPagado()).isEqualByComparingTo(new BigDecimal("741.54"));
        assertThat(c72.getInteresPagado()).isEqualByComparingTo(new BigDecimal("222.46"));
        assertThat(c72.getEstado()).isEqualTo(CuotaEstado.PAGADA);

        verify(operacionRepository).save(argThat(op -> {
            boolean tieneCapP70 = op.getDetalles().stream().anyMatch(d -> d.getMonto().compareTo(new BigDecimal("987.48")) == 0 && Objects.equals(d.getCuotaId(), c70.getId()));
            boolean tieneCapP72 = op.getDetalles().stream().anyMatch(d -> d.getMonto().compareTo(new BigDecimal("741.54")) == 0 && Objects.equals(d.getCuotaId(), c72.getId()));
            return tieneCapP70 && tieneCapP72;
        }));
    }
}
