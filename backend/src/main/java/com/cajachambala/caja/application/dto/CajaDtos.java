package com.cajachambala.caja.application.dto;

import com.cajachambala.caja.domain.FlujoTipo;
import com.cajachambala.caja.domain.OperacionEstado;
import com.cajachambala.caja.domain.PeriodoEstado;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public class CajaDtos {

    public record CrearPeriodoRequest(
            @NotNull(message = "El año es obligatorio")
            Short anio,

            @NotNull(message = "El mes es obligatorio")
            Short mes,

            LocalDate fechaReunion
    ) {}

    public record PeriodoResponse(
            UUID id,
            Short anio,
            Short mes,
            LocalDate fechaReunion,
            PeriodoEstado estado,
            Instant cerradoAt,
            UUID cerradoPor,
            BigDecimal saldoAnterior,
            BigDecimal totalIngresos,
            BigDecimal totalEgresos,
            BigDecimal saldoFinal
    ) {}

    public record ConceptoResponse(
            Short id,
            String codigo,
            String nombre,
            FlujoTipo tipo,
            boolean requiereSocio,
            Short orden
    ) {}

    public record DetalleOperacionRequest(
            @NotNull(message = "El concepto es obligatorio")
            Short conceptoId,

            @NotNull(message = "El monto es obligatorio")
            @DecimalMin(value = "0.01", message = "El monto debe ser mayor a cero")
            BigDecimal monto,

            UUID prestamoId,
            UUID cuotaId
    ) {}

    public record RegistrarOperacionRequest(
            UUID socioId,
            @NotNull(message = "El tipo de flujo es obligatorio")
            FlujoTipo tipo,
            LocalDate fecha,
            Integer nroRecibo,
            String descripcion,
            @NotNull(message = "Debe incluir al menos un concepto en el detalle")
            List<DetalleOperacionRequest> detalles
    ) {}

    public record DetalleOperacionResponse(
            UUID id,
            Short conceptoId,
            String conceptoCodigo,
            String conceptoNombre,
            BigDecimal monto
    ) {}

    public record OperacionResponse(
            UUID id,
            UUID periodoId,
            UUID socioId,
            String socioNombre,
            Integer socioCodigo,
            FlujoTipo tipo,
            LocalDate fecha,
            Integer nroRecibo,
            String descripcion,
            BigDecimal total,
            OperacionEstado estado,
            List<DetalleOperacionResponse> detalles,
            Instant anuladoAt,
            String motivoAnulacion
    ) {}

    public record AnularOperacionRequest(
            @NotBlank(message = "El motivo de anulación es obligatorio")
            String motivo
    ) {}

    public record RegistrarArqueoRequest(
            @NotNull(message = "El monto en efectivo es obligatorio")
            @DecimalMin(value = "0.00", message = "El efectivo no puede ser negativo")
            BigDecimal efectivo,

            @NotNull(message = "Los depósitos en bancos son obligatorios")
            @DecimalMin(value = "0.00", message = "Los depósitos no pueden ser negativos")
            BigDecimal depositosBancos,

            String observacion
    ) {}

    public record ArqueoResponse(
            UUID periodoId,
            BigDecimal efectivo,
            BigDecimal depositosBancos,
            BigDecimal totalContado,
            BigDecimal saldoSistema,
            BigDecimal diferencia,
            String observacion,
            Instant createdAt
    ) {}

    public record ReabrirPeriodoRequest(
            @NotBlank(message = "La justificación de reapertura es obligatoria")
            String motivo
    ) {}

    public record CierrePeriodoResponse(
            UUID periodoId,
            BigDecimal saldoAnterior,
            BigDecimal totalIngresos,
            BigDecimal totalEgresos,
            BigDecimal saldoFinal,
            String hashIntegridad,
            Map<String, Object> detalle,
            Instant createdAt
    ) {}

    public record DetalleCuotaPlanilla(
            UUID prestamoId,
            Integer prestamoNumero,
            UUID cuotaId,
            Integer cuotaNro,
            Integer cuotasTotal,
            LocalDate fechaVencimiento,
            BigDecimal capitalProgramado,
            BigDecimal interesProgramado,
            BigDecimal capitalPagado,
            BigDecimal interesPagado,
            Boolean esAdelanto,
            String estado
    ) {}

    public record FilaPlanillaMensual(
            Integer nroRecibo,
            UUID socioId,
            String socioNombre,
            Integer socioCodigo,
            // Ingresos
            BigDecimal ahorro,
            BigDecimal pagoCapital,
            BigDecimal interesRecibido,
            BigDecimal acciones,
            BigDecimal tardanzaMulta,
            BigDecimal reservas,
            BigDecimal totalIngreso,
            // Egresos
            BigDecimal retiroAhorro,
            BigDecimal prestamo,
            BigDecimal interesPagado,
            BigDecimal gastoAdmin,
            BigDecimal utilidad,
            BigDecimal red,
            BigDecimal otroEgreso,
            BigDecimal totalEgreso,
            // Operaciones asociadas
            UUID operacionIngresoId,
            UUID operacionEgresoId,
            UUID prestamoId,
            // Campos interactivos para validación y edición
            Boolean accionesPagado,
            Boolean cuotaPagada,
            BigDecimal cuotaCapitalProgramado,
            BigDecimal cuotaInteresProgramado,
            UUID cuotaId,
            Integer cuotaNro,
            Integer cuotasTotal,
            Integer prestamoNumero,
            List<DetalleCuotaPlanilla> detallesPrestamos,
            List<DetalleCuotaPlanilla> cuotasDisponiblesAdelanto
    ) {
        public FilaPlanillaMensual(
                Integer nroRecibo,
                UUID socioId,
                String socioNombre,
                Integer socioCodigo,
                BigDecimal ahorro,
                BigDecimal pagoCapital,
                BigDecimal interesRecibido,
                BigDecimal acciones,
                BigDecimal tardanzaMulta,
                BigDecimal reservas,
                BigDecimal totalIngreso,
                BigDecimal retiroAhorro,
                BigDecimal prestamo,
                BigDecimal interesPagado,
                BigDecimal gastoAdmin,
                BigDecimal utilidad,
                BigDecimal red,
                BigDecimal otroEgreso,
                BigDecimal totalEgreso,
                UUID operacionIngresoId,
                UUID operacionEgresoId,
                UUID prestamoId,
                Boolean accionesPagado,
                Boolean cuotaPagada,
                BigDecimal cuotaCapitalProgramado,
                BigDecimal cuotaInteresProgramado,
                UUID cuotaId,
                Integer cuotaNro,
                Integer cuotasTotal,
                Integer prestamoNumero
        ) {
            this(nroRecibo, socioId, socioNombre, socioCodigo, ahorro, pagoCapital, interesRecibido, acciones, tardanzaMulta, reservas, totalIngreso, retiroAhorro, prestamo, interesPagado, gastoAdmin, utilidad, red, otroEgreso, totalEgreso, operacionIngresoId, operacionEgresoId, prestamoId, accionesPagado, cuotaPagada, cuotaCapitalProgramado, cuotaInteresProgramado, cuotaId, cuotaNro, cuotasTotal, prestamoNumero, Collections.emptyList(), Collections.emptyList());
        }
    }

    public record GuardarFilaPlanillaRequest(
            UUID socioId,
            BigDecimal ahorro,
            BigDecimal pagoCapital,
            BigDecimal interesRecibido,
            BigDecimal acciones,
            BigDecimal tardanzaMulta,
            BigDecimal reservas,
            Boolean accionesPagado,
            Boolean cuotaPagada,
            UUID cuotaId,
            UUID prestamoId,
            List<UUID> cuotasSeleccionadasIds
    ) {
        public GuardarFilaPlanillaRequest(
                UUID socioId,
                BigDecimal ahorro,
                BigDecimal pagoCapital,
                BigDecimal interesRecibido,
                BigDecimal acciones,
                BigDecimal tardanzaMulta,
                BigDecimal reservas,
                Boolean accionesPagado,
                Boolean cuotaPagada,
                UUID cuotaId,
                UUID prestamoId
        ) {
            this(socioId, ahorro, pagoCapital, interesRecibido, acciones, tardanzaMulta, reservas, accionesPagado, cuotaPagada, cuotaId, prestamoId, null);
        }
    }

    public record GuardarPlanillaRequest(
            List<GuardarFilaPlanillaRequest> filas
    ) {}

    public record PlanillaMensualResponse(
            PeriodoResponse periodo,
            List<FilaPlanillaMensual> filas,
            Map<String, BigDecimal> totalesIngresos,
            Map<String, BigDecimal> totalesEgresos,
            BigDecimal totalIngresosMes,
            BigDecimal totalEgresosMes,
            BigDecimal saldoAnterior,
            BigDecimal saldoFinal
    ) {}
}
