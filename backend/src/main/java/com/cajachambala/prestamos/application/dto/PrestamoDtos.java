package com.cajachambala.prestamos.application.dto;

import com.cajachambala.prestamos.domain.CuotaEstado;
import com.cajachambala.prestamos.domain.PrestamoEstado;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public class PrestamoDtos {

    public record SimularPrestamoRequest(
            @NotNull(message = "El monto principal es obligatorio")
            @DecimalMin(value = "1.00", message = "El monto debe ser al menos S/. 1.00")
            BigDecimal montoPrincipal,

            @NotNull(message = "La tasa mensual es obligatoria")
            @DecimalMin(value = "0.0000", message = "La tasa mensual no puede ser negativa")
            @DecimalMax(value = "1.0000", message = "La tasa mensual no puede superar 100%")
            BigDecimal tasaMensual,

            @NotNull(message = "El número de cuotas es obligatorio")
            @Min(value = 1, message = "El préstamo debe tener al menos 1 cuota")
            @Max(value = 60, message = "El préstamo no puede superar 60 cuotas")
            Integer nroCuotas,

            LocalDate fechaDesembolso,
            LocalDate fechaPrimeraCuota
    ) {}

    public record CuotaSimuladaResponse(
            Integer nroCuota,
            LocalDate fechaVencimiento,
            BigDecimal capitalProgramado,
            BigDecimal interesProgramado,
            BigDecimal cuotaProgramada,
            BigDecimal saldoRestante
    ) {}

    public record SimulacionPrestamoResponse(
            BigDecimal montoPrincipal,
            BigDecimal tasaMensual,
            BigDecimal tasaPorcentaje,
            Integer nroCuotas,
            BigDecimal totalInteres,
            BigDecimal totalPagar,
            List<CuotaSimuladaResponse> cronograma
    ) {}

    public record SolicitarPrestamoRequest(
            @NotNull(message = "El ID del socio es obligatorio")
            UUID socioId,

            @NotNull(message = "El monto principal es obligatorio")
            @DecimalMin(value = "1.00", message = "El monto debe ser al menos S/. 1.00")
            BigDecimal montoPrincipal,

            @DecimalMin(value = "0.0000", message = "La tasa no puede ser negativa")
            @DecimalMax(value = "1.0000", message = "La tasa no puede superar 100%")
            BigDecimal tasaMensual,

            @NotNull(message = "El número de cuotas es obligatorio")
            @Min(value = 1, message = "Debe tener al menos 1 cuota")
            @Max(value = 60, message = "Máximo 60 cuotas permitidas")
            Short nroCuotas,

            @NotNull(message = "La fecha de desembolso es obligatoria")
            LocalDate fechaDesembolso,

            @NotNull(message = "La fecha de primera cuota es obligatoria")
            LocalDate fechaPrimeraCuota,

            String proposito
    ) {}

    public record AprobarPrestamoRequest(
            String observacion
    ) {}

    public record DesembolsarPrestamoRequest(
            @NotNull(message = "El ID del periodo contable es obligatorio")
            UUID periodoId,

            LocalDate fechaDesembolso
    ) {}

    public record RegistrarPagoCuotaRequest(
            @NotNull(message = "El ID del periodo contable es obligatorio")
            UUID periodoId,

            LocalDate fechaPago,

            @NotNull(message = "El monto de amortización a capital es obligatorio")
            @DecimalMin(value = "0.00", message = "El capital abonado no puede ser negativo")
            BigDecimal montoCapital,

            @NotNull(message = "El monto de interés es obligatorio")
            @DecimalMin(value = "0.00", message = "El interés abonado no puede ser negativo")
            BigDecimal montoInteres,

            @DecimalMin(value = "0.00", message = "La mora no puede ser negativa")
            BigDecimal montoMora,

            String observacion
    ) {}

    public record CuotaPrestamoResponse(
            UUID id,
            Short nroCuota,
            LocalDate fechaVencimiento,
            BigDecimal capitalProgramado,
            BigDecimal interesProgramado,
            BigDecimal cuotaProgramada,
            BigDecimal capitalPagado,
            BigDecimal interesPagado,
            BigDecimal moraPagada,
            BigDecimal saldoCapital,
            BigDecimal saldoInteres,
            BigDecimal totalPendiente,
            CuotaEstado estado,
            LocalDate fechaPago,
            Instant updatedAt
    ) {}

    public record PrestamoResponse(
            UUID id,
            UUID cajaId,
            UUID socioId,
            Integer socioCodigo,
            String socioNombreCompleto,
            String socioDocumento,
            Integer numero,
            BigDecimal montoPrincipal,
            BigDecimal tasaMensual,
            Short nroCuotas,
            String metodoAmortizacion,
            LocalDate fechaDesembolso,
            LocalDate fechaPrimeraCuota,
            PrestamoEstado estado,
            String proposito,
            BigDecimal capitalPagado,
            BigDecimal saldoCapital,
            BigDecimal interesPagado,
            Integer cuotasPagadas,
            Integer cuotasVencidas,
            Instant createdAt,
            Instant updatedAt
    ) {}

    public record PrestamoDetalleResponse(
            PrestamoResponse prestamo,
            List<CuotaPrestamoResponse> cronograma
    ) {}

    public record ResumenCarteraResponse(
            long totalPrestamos,
            long vigentes,
            long cancelados,
            long solicitados,
            BigDecimal saldoCapitalColocado,
            BigDecimal totalCapitalCobrado,
            BigDecimal totalInteresesGanados,
            long cuotasVencidasTotal
    ) {}

    public record EditarPrestamoRequest(
            @NotNull(message = "El periodo contable es obligatorio")
            UUID periodoId,

            @DecimalMin(value = "1.00", message = "El monto debe ser al menos S/. 1.00")
            BigDecimal montoPrincipal,

            @DecimalMin(value = "0.0000", message = "La tasa no puede ser negativa")
            @DecimalMax(value = "1.0000", message = "La tasa no puede superar 100%")
            BigDecimal tasaMensual,

            @Min(value = 1, message = "Debe tener al menos 1 cuota")
            @Max(value = 60, message = "Máximo 60 cuotas permitidas")
            Short nroCuotas,

            LocalDate fechaDesembolso,
            LocalDate fechaPrimeraCuota,
            String proposito,

            @NotBlank(message = "Debe ingresar una observación o motivo de la modificación")
            String observacion
    ) {}

    public record EliminarPrestamoRequest(
            @NotNull(message = "El periodo contable es obligatorio")
            UUID periodoId,

            @NotBlank(message = "Debe ingresar un comentario o motivo de la eliminación")
            @Size(min = 5, message = "El comentario debe tener al menos 5 caracteres")
            String motivo
    ) {}

    public record ModificarCuotaItemRequest(
            @NotNull(message = "El ID de la cuota es obligatorio")
            UUID cuotaId,

            @DecimalMin(value = "0.00", message = "El capital programado no puede ser negativo")
            BigDecimal capitalProgramado,

            @DecimalMin(value = "0.00", message = "El interés programado no puede ser negativo")
            BigDecimal interesProgramado,

            LocalDate fechaVencimiento
    ) {}

    public record ModificarCuotasPrestamoRequest(
            @NotNull(message = "La lista de cuotas es obligatoria")
            @NotEmpty(message = "Debe enviar al menos una cuota a modificar")
            List<ModificarCuotaItemRequest> cuotas,

            @NotBlank(message = "Debe ingresar una observación obligatoria para modificar las cuotas")
            @Size(min = 5, message = "La observación debe tener al menos 5 caracteres")
            String observacion
    ) {}
}
