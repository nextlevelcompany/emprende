package com.cajachambala.utilidades.application.dto;

import com.cajachambala.utilidades.domain.DistribucionEstado;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public class UtilidadDtos {

    public record SocioAccionesInput(
            @NotNull(message = "El ID del socio es obligatorio")
            UUID socioId,

            @NotNull(message = "El número de acciones es obligatorio")
            @Min(value = 0, message = "El número de acciones no puede ser negativo")
            Integer acciones
    ) {}

    public record SimularDistribucionRequest(
            @NotNull(message = "El ejercicio contable es obligatorio")
            @Min(value = 2020, message = "Año inválido")
            @Max(value = 2100, message = "Año inválido")
            Short ejercicio,

            LocalDate fechaCorte,

            @NotNull(message = "La utilidad total a distribuir es obligatoria")
            @DecimalMin(value = "0.01", message = "La utilidad a distribuir debe ser mayor a 0")
            BigDecimal utilidadTotal,

            List<SocioAccionesInput> sociosManuales
    ) {}

    public record GuardarDistribucionRequest(
            @NotNull(message = "El ejercicio contable es obligatorio")
            @Min(value = 2020, message = "Año inválido")
            @Max(value = 2100, message = "Año inválido")
            Short ejercicio,

            @NotNull(message = "La fecha de corte es obligatoria")
            LocalDate fechaCorte,

            @NotNull(message = "La utilidad total a distribuir es obligatoria")
            @DecimalMin(value = "0.01", message = "La utilidad a distribuir debe ser mayor a 0")
            BigDecimal utilidadTotal,

            @NotEmpty(message = "Debe incluir la asignación de socios y acciones")
            List<SocioAccionesInput> socios
    ) {}

    public record PagarDistribucionRequest(
            @NotNull(message = "El periodo contable es obligatorio")
            UUID periodoId,

            LocalDate fechaPago
    ) {}

    public record DetalleDistribucionResponse(
            UUID socioId,
            Integer socioCodigo,
            String socioNombreCompleto,
            String socioDocumento,
            Integer acciones,
            BigDecimal porcentajeParticipacion,
            BigDecimal monto,
            UUID operacionId
    ) {}

    public record DistribucionResponse(
            UUID id,
            UUID cajaId,
            Short ejercicio,
            LocalDate fechaCorte,
            BigDecimal utilidadTotal,
            Integer totalAcciones,
            BigDecimal valorPorAccion,
            DistribucionEstado estado,
            List<DetalleDistribucionResponse> detalles,
            Instant createdAt,
            Instant updatedAt
    ) {}

    public record ResumenEjercicioResponse(
            Short ejercicio,
            BigDecimal totalIngresos,
            BigDecimal totalEgresos,
            BigDecimal utilidadNetaCaja,
            Integer totalSociosActivos,
            Integer totalAccionesEstimadas,
            BigDecimal valorAccionNominal
    ) {}
}
