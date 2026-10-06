package com.cajachambala.prestamos.application;

import com.cajachambala.caja.domain.Concepto;
import com.cajachambala.caja.domain.FlujoTipo;
import com.cajachambala.caja.domain.Operacion;
import com.cajachambala.caja.domain.Periodo;
import com.cajachambala.caja.domain.PeriodoEstado;
import com.cajachambala.caja.infrastructure.persistence.ConceptoRepository;
import com.cajachambala.caja.infrastructure.persistence.OperacionRepository;
import com.cajachambala.caja.infrastructure.persistence.PeriodoRepository;
import com.cajachambala.identidad.infrastructure.audit.AuditService;
import com.cajachambala.prestamos.application.dto.PrestamoDtos.*;
import com.cajachambala.prestamos.domain.CuotaEstado;
import com.cajachambala.prestamos.domain.CuotaPrestamo;
import com.cajachambala.prestamos.domain.Prestamo;
import com.cajachambala.prestamos.domain.PrestamoEstado;
import com.cajachambala.prestamos.infrastructure.persistence.CuotaPrestamoRepository;
import com.cajachambala.prestamos.infrastructure.persistence.PrestamoRepository;
import com.cajachambala.socios.domain.Socio;
import com.cajachambala.socios.domain.SocioTipo;
import com.cajachambala.socios.infrastructure.persistence.SocioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PrestamoServiceTest {

    @Mock
    private PrestamoRepository prestamoRepository;

    @Mock
    private CuotaPrestamoRepository cuotaPrestamoRepository;

    @Mock
    private SocioRepository socioRepository;

    @Mock
    private PeriodoRepository periodoRepository;

    @Mock
    private ConceptoRepository conceptoRepository;

    @Mock
    private OperacionRepository operacionRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private PrestamoService prestamoService;

    private UUID cajaId;
    private UUID socioId;
    private UUID periodoId;

    @BeforeEach
    void setUp() {
        cajaId = UUID.fromString("a0000000-0000-0000-0000-000000000001");
        socioId = UUID.randomUUID();
        periodoId = UUID.randomUUID();
    }

    @Test
    @DisplayName("Simular préstamo de S/. 1000 en 4 cuotas al 5% calcula amortización e interés exactos")
    void simularPrestamo_calculoExacto() {
        SimularPrestamoRequest req = new SimularPrestamoRequest(
                new BigDecimal("1000.00"),
                new BigDecimal("0.0500"),
                4,
                LocalDate.of(2025, 10, 8),
                LocalDate.of(2025, 11, 8)
        );

        SimulacionPrestamoResponse response = prestamoService.simular(req);

        assertThat(response.montoPrincipal()).isEqualByComparingTo("1000.00");
        assertThat(response.nroCuotas()).isEqualTo(4);
        assertThat(response.cronograma()).hasSize(4);

        // Cuota 1: Capital 250, Interés 1000 * 0.05 = 50.00, Cuota 300, Saldo 750
        CuotaSimuladaResponse c1 = response.cronograma().get(0);
        assertThat(c1.capitalProgramado()).isEqualByComparingTo("250.00");
        assertThat(c1.interesProgramado()).isEqualByComparingTo("50.00");
        assertThat(c1.cuotaProgramada()).isEqualByComparingTo("300.00");
        assertThat(c1.saldoRestante()).isEqualByComparingTo("750.00");

        // Cuota 2: Capital 250, Interés 750 * 0.05 = 37.50, Cuota 287.50, Saldo 500
        CuotaSimuladaResponse c2 = response.cronograma().get(1);
        assertThat(c2.capitalProgramado()).isEqualByComparingTo("250.00");
        assertThat(c2.interesProgramado()).isEqualByComparingTo("37.50");
        assertThat(c2.cuotaProgramada()).isEqualByComparingTo("287.50");
        assertThat(c2.saldoRestante()).isEqualByComparingTo("500.00");

        // Cuota 4: Saldo restante debe ser 0.00
        CuotaSimuladaResponse c4 = response.cronograma().get(3);
        assertThat(c4.saldoRestante()).isEqualByComparingTo("0.00");

        // Suma de amortizaciones = 1000.00
        BigDecimal sumaCapital = response.cronograma().stream()
                .map(CuotaSimuladaResponse::capitalProgramado)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        assertThat(sumaCapital).isEqualByComparingTo("1000.00");
    }

    @Test
    @DisplayName("Simular préstamo con centavos inexactos (S/. 100 en 3 cuotas) ajusta la última cuota a 33.34")
    void simularPrestamo_ajusteCentavosUltimaCuota() {
        SimularPrestamoRequest req = new SimularPrestamoRequest(
                new BigDecimal("100.00"),
                new BigDecimal("0.0500"),
                3,
                LocalDate.of(2025, 10, 8),
                LocalDate.of(2025, 11, 8)
        );

        SimulacionPrestamoResponse response = prestamoService.simular(req);

        assertThat(response.cronograma().get(0).capitalProgramado()).isEqualByComparingTo("33.33");
        assertThat(response.cronograma().get(1).capitalProgramado()).isEqualByComparingTo("33.33");
        assertThat(response.cronograma().get(2).capitalProgramado()).isEqualByComparingTo("33.34");

        BigDecimal totalCapital = response.cronograma().stream()
                .map(CuotaSimuladaResponse::capitalProgramado)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        assertThat(totalCapital).isEqualByComparingTo("100.00");
    }

    @Test
    @DisplayName("Desembolsar préstamo genera cuotas en BD y egreso contable en el periodo")
    void desembolsarPrestamo_exitoso() {
        UUID prestamoId = UUID.randomUUID();
        Prestamo prestamo = new Prestamo(
                cajaId, socioId, 1,
                new BigDecimal("500.00"),
                new BigDecimal("0.0500"),
                (short) 2,
                LocalDate.of(2025, 10, 8),
                LocalDate.of(2025, 11, 8),
                "Préstamo para mercadería",
                UUID.randomUUID()
        );
        prestamo.aprobar(UUID.randomUUID());

        Socio socio = new Socio(cajaId, 1, SocioTipo.SOCIO, "Juan", "Perez", "DNI", "12345678".getBytes(), "hash", "987654321", "juan@test.com", "Chambala", LocalDate.now(), UUID.randomUUID());
        Periodo periodo = new Periodo(cajaId, (short) 2025, (short) 10, LocalDate.of(2025, 10, 8));
        Concepto conceptoPrestamo = new Concepto((short) 2, "PRESTAMO", "Préstamos", FlujoTipo.EGRESO, true, (short) 2);

        when(prestamoRepository.findByIdAndCajaId(prestamoId, cajaId)).thenReturn(Optional.of(prestamo));
        when(periodoRepository.findByIdAndCajaId(periodoId, cajaId)).thenReturn(Optional.of(periodo));
        when(socioRepository.findByIdAndCajaId(socioId, cajaId)).thenReturn(Optional.of(socio));
        when(conceptoRepository.findByCodigo("PRESTAMO")).thenReturn(Optional.of(conceptoPrestamo));
        when(prestamoRepository.save(any(Prestamo.class))).thenAnswer(i -> i.getArgument(0));

        DesembolsarPrestamoRequest req = new DesembolsarPrestamoRequest(periodoId, LocalDate.of(2025, 10, 8));
        PrestamoDetalleResponse response = prestamoService.desembolsar(prestamoId, req);

        assertThat(response.prestamo().estado()).isEqualTo(PrestamoEstado.VIGENTE);
        assertThat(response.cronograma()).hasSize(2);

        // Verifica que se haya guardado la operación contable de egreso
        ArgumentCaptor<Operacion> opCaptor = ArgumentCaptor.forClass(Operacion.class);
        verify(operacionRepository).save(opCaptor.capture());
        Operacion opGuardada = opCaptor.getValue();

        assertThat(opGuardada.getTipo()).isEqualTo(FlujoTipo.EGRESO);
        assertThat(opGuardada.getTotal()).isEqualByComparingTo("500.00");
        assertThat(opGuardada.getDetalles()).hasSize(1);
        assertThat(opGuardada.getDetalles().get(0).getPrestamoId()).isEqualTo(prestamo.getId());
    }

    @Test
    @DisplayName("Cobrar cuota registra abono y genera operación de ingreso con detalle de capital e interés")
    void registrarPagoCuota_exitoso() {
        UUID prestamoId = UUID.randomUUID();
        UUID cuotaId = UUID.randomUUID();

        Prestamo prestamo = new Prestamo(
                cajaId, socioId, 1,
                new BigDecimal("500.00"),
                new BigDecimal("0.0500"),
                (short) 1,
                LocalDate.of(2025, 10, 8),
                LocalDate.of(2025, 11, 8),
                "Préstamo personal",
                UUID.randomUUID()
        );
        prestamo.desembolsar(LocalDate.of(2025, 10, 8));

        CuotaPrestamo cuota = new CuotaPrestamo(
                prestamo,
                (short) 1,
                LocalDate.of(2025, 11, 8),
                new BigDecimal("500.00"),
                new BigDecimal("25.00")
        );
        prestamo.agregarCuota(cuota);

        Socio socio = new Socio(cajaId, 1, SocioTipo.SOCIO, "Juan", "Perez", "DNI", "12345678".getBytes(), "hash", "987654321", "juan@test.com", "Chambala", LocalDate.now(), UUID.randomUUID());
        Periodo periodo = new Periodo(cajaId, (short) 2025, (short) 11, LocalDate.of(2025, 11, 8));
        Concepto conceptoCapital = new Concepto((short) 2, "PAGO_CAPITAL", "Pagos de capital", FlujoTipo.INGRESO, true, (short) 2);
        Concepto conceptoInteres = new Concepto((short) 3, "INTERES_RECIBIDO", "Intereses recibidos", FlujoTipo.INGRESO, true, (short) 3);

        when(prestamoRepository.findByIdAndCajaId(prestamoId, cajaId)).thenReturn(Optional.of(prestamo));
        when(cuotaPrestamoRepository.findByIdAndPrestamoId(cuotaId, prestamoId)).thenReturn(Optional.of(cuota));
        when(periodoRepository.findByIdAndCajaId(periodoId, cajaId)).thenReturn(Optional.of(periodo));
        when(socioRepository.findByIdAndCajaId(socioId, cajaId)).thenReturn(Optional.of(socio));
        when(conceptoRepository.findByCodigo("PAGO_CAPITAL")).thenReturn(Optional.of(conceptoCapital));
        when(conceptoRepository.findByCodigo("INTERES_RECIBIDO")).thenReturn(Optional.of(conceptoInteres));
        when(operacionRepository.findMaxNroReciboByCajaId(cajaId)).thenReturn(10);
        when(prestamoRepository.save(any(Prestamo.class))).thenAnswer(i -> i.getArgument(0));

        RegistrarPagoCuotaRequest req = new RegistrarPagoCuotaRequest(
                periodoId,
                LocalDate.of(2025, 11, 8),
                new BigDecimal("500.00"),
                new BigDecimal("25.00"),
                BigDecimal.ZERO,
                "Pago total de cuota única"
        );

        PrestamoDetalleResponse response = prestamoService.registrarPagoCuota(prestamoId, cuotaId, req);

        // Al haber pagado la totalidad de la única cuota, el préstamo debe pasar a CANCELADO
        assertThat(response.prestamo().estado()).isEqualTo(PrestamoEstado.CANCELADO);
        assertThat(cuota.getEstado()).isEqualTo(CuotaEstado.PAGADA);

        // Verifica que se guarde la operación contable de ingreso con 2 detalles (capital + interés)
        ArgumentCaptor<Operacion> opCaptor = ArgumentCaptor.forClass(Operacion.class);
        verify(operacionRepository).save(opCaptor.capture());
        Operacion ingreso = opCaptor.getValue();

        assertThat(ingreso.getTipo()).isEqualTo(FlujoTipo.INGRESO);
        assertThat(ingreso.getTotal()).isEqualByComparingTo("525.00");
        assertThat(ingreso.getDetalles()).hasSize(2);
    }
}
