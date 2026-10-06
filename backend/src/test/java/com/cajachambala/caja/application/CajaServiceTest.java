package com.cajachambala.caja.application;

import com.cajachambala.caja.application.dto.CajaDtos.*;
import com.cajachambala.caja.domain.*;
import com.cajachambala.caja.infrastructure.persistence.*;
import com.cajachambala.identidad.infrastructure.audit.AuditService;
import com.cajachambala.shared.infrastructure.security.UserContext;
import com.cajachambala.shared.infrastructure.security.UserContextHolder;
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
}
