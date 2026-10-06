package com.cajachambala.utilidades.application;

import com.cajachambala.caja.domain.Concepto;
import com.cajachambala.caja.domain.FlujoTipo;
import com.cajachambala.caja.domain.Operacion;
import com.cajachambala.caja.domain.Periodo;
import com.cajachambala.caja.infrastructure.persistence.ConceptoRepository;
import com.cajachambala.caja.infrastructure.persistence.OperacionRepository;
import com.cajachambala.caja.infrastructure.persistence.PeriodoRepository;
import com.cajachambala.identidad.infrastructure.audit.AuditService;
import com.cajachambala.socios.domain.Socio;
import com.cajachambala.socios.domain.SocioTipo;
import com.cajachambala.socios.infrastructure.persistence.SocioRepository;
import com.cajachambala.utilidades.application.dto.UtilidadDtos.*;
import com.cajachambala.utilidades.domain.DistribucionEstado;
import com.cajachambala.utilidades.domain.DistribucionUtilidad;
import com.cajachambala.utilidades.domain.DistribucionUtilidadDetalle;
import com.cajachambala.utilidades.infrastructure.persistence.DistribucionUtilidadDetalleRepository;
import com.cajachambala.utilidades.infrastructure.persistence.DistribucionUtilidadRepository;
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
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DistribucionUtilidadServiceTest {

    @Mock
    private DistribucionUtilidadRepository distribucionRepository;

    @Mock
    private DistribucionUtilidadDetalleRepository detalleRepository;

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
    private DistribucionUtilidadService service;

    private UUID cajaId;
    private UUID socio1Id;
    private UUID socio2Id;
    private UUID socio3Id;

    @BeforeEach
    void setUp() {
        cajaId = UUID.fromString("a0000000-0000-0000-0000-000000000001");
        socio1Id = UUID.randomUUID();
        socio2Id = UUID.randomUUID();
        socio3Id = UUID.randomUUID();
    }

    @Test
    @DisplayName("Simular distribución reparte proporcional a acciones y ajusta centavos en la última fila")
    void simular_repartoProporcionalYCuadraturaExacta() {
        // 100 soles a repartir entre 3 socios con 1 acción cada uno (total 3 acciones)
        // 100 / 3 = 33.333333 -> Socio 1: 33.33, Socio 2: 33.33, Socio 3: 33.34
        Socio s1 = new Socio(cajaId, 1, SocioTipo.SOCIO, "Socio 1", "Perez", "DNI", "111".getBytes(), "h1", "999", "s1@test.com", "Dir", LocalDate.now(), UUID.randomUUID());
        Socio s2 = new Socio(cajaId, 2, SocioTipo.SOCIO, "Socio 2", "Gomez", "DNI", "222".getBytes(), "h2", "999", "s2@test.com", "Dir", LocalDate.now(), UUID.randomUUID());
        Socio s3 = new Socio(cajaId, 3, SocioTipo.SOCIO, "Socio 3", "Lopez", "DNI", "333".getBytes(), "h3", "999", "s3@test.com", "Dir", LocalDate.now(), UUID.randomUUID());

        when(socioRepository.findAllById(any())).thenReturn(List.of(s1, s2, s3));

        SimularDistribucionRequest req = new SimularDistribucionRequest(
                (short) 2024,
                LocalDate.of(2024, 12, 31),
                new BigDecimal("100.00"),
                List.of(
                        new SocioAccionesInput(socio1Id, 1),
                        new SocioAccionesInput(socio2Id, 1),
                        new SocioAccionesInput(socio3Id, 1)
                )
        );

        DistribucionResponse resp = service.simular(req);

        assertThat(resp.utilidadTotal()).isEqualByComparingTo("100.00");
        assertThat(resp.totalAcciones()).isEqualTo(3);
        assertThat(resp.detalles()).hasSize(3);

        BigDecimal sumaRenglones = resp.detalles().stream()
                .map(DetalleDistribucionResponse::monto)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Cuadratura absoluta
        assertThat(sumaRenglones).isEqualByComparingTo("100.00");
        assertThat(resp.detalles().get(0).monto()).isEqualByComparingTo("33.33");
        assertThat(resp.detalles().get(1).monto()).isEqualByComparingTo("33.33");
        assertThat(resp.detalles().get(2).monto()).isEqualByComparingTo("33.34"); // centavo ajustado
    }

    @Test
    @DisplayName("Pagar distribución genera egresos contables individuales con concepto UTILIDAD_DISTRIBUIDA")
    void pagar_generaEgresosContables() {
        UUID distId = UUID.randomUUID();
        UUID periodoId = UUID.randomUUID();

        DistribucionUtilidad dist = new DistribucionUtilidad(cajaId, (short) 2024, LocalDate.of(2024, 12, 31), new BigDecimal("500.00"), 10);
        dist.aprobar(UUID.randomUUID());

        DistribucionUtilidadDetalle det1 = new DistribucionUtilidadDetalle(dist.getId(), socio1Id, 10, new BigDecimal("500.00"));
        dist.agregarDetalle(det1);

        Periodo periodo = new Periodo(cajaId, (short) 2024, (short) 12, LocalDate.of(2024, 12, 8));
        Socio s1 = new Socio(cajaId, 1, SocioTipo.SOCIO, "Juan", "Perez", "DNI", "111".getBytes(), "h1", "999", "s1@test.com", "Dir", LocalDate.now(), UUID.randomUUID());
        Concepto conceptoUtilidad = new Concepto((short) 5, "UTILIDAD_DISTRIBUIDA", "Utilidad distribuida", FlujoTipo.EGRESO, true, (short) 5);

        when(distribucionRepository.findByIdAndCajaId(distId, cajaId)).thenReturn(Optional.of(dist));
        when(periodoRepository.findByIdAndCajaId(periodoId, cajaId)).thenReturn(Optional.of(periodo));
        when(conceptoRepository.findByCodigo("UTILIDAD_DISTRIBUIDA")).thenReturn(Optional.of(conceptoUtilidad));
        when(socioRepository.findAllById(any())).thenReturn(List.of(s1));
        when(operacionRepository.save(any(Operacion.class))).thenAnswer(i -> i.getArgument(0));
        when(distribucionRepository.save(any(DistribucionUtilidad.class))).thenAnswer(i -> i.getArgument(0));

        PagarDistribucionRequest req = new PagarDistribucionRequest(periodoId, LocalDate.of(2024, 12, 8));
        DistribucionResponse resp = service.pagar(distId, req);

        assertThat(resp.estado()).isEqualTo(DistribucionEstado.PAGADA);

        ArgumentCaptor<Operacion> opCaptor = ArgumentCaptor.forClass(Operacion.class);
        verify(operacionRepository).save(opCaptor.capture());
        Operacion egreso = opCaptor.getValue();

        assertThat(egreso.getTipo()).isEqualTo(FlujoTipo.EGRESO);
        assertThat(egreso.getTotal()).isEqualByComparingTo("500.00");
        assertThat(egreso.getDetalles()).hasSize(1);
        assertThat(egreso.getDetalles().get(0).getConceptoId()).isEqualTo((short) 5);
    }
}
