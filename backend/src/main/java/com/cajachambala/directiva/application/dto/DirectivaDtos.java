package com.cajachambala.directiva.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public class DirectivaDtos {

    public record DirectivaCargoDto(
            UUID id,
            String cargo,
            String cargoTitulo,
            UUID socioId,
            Integer socioCodigo,
            String nombreCompleto,
            String tipoDocumento,
            String numeroDocumento,
            String telefono,
            String email,
            LocalDate periodoInicio,
            LocalDate periodoFin,
            Boolean activo,
            Short orden,
            String observaciones
    ) {}

    public record GuardarCargoItemRequest(
            UUID id,
            @NotBlank(message = "El identificador del cargo es obligatorio")
            String cargo,
            @NotBlank(message = "El título formal del cargo es obligatorio")
            String cargoTitulo,
            UUID socioId,
            @NotBlank(message = "El nombre completo es obligatorio")
            String nombreCompleto,
            String tipoDocumento,
            String numeroDocumento,
            String telefono,
            String email,
            LocalDate periodoInicio,
            LocalDate periodoFin,
            Boolean activo,
            Short orden,
            String observaciones
    ) {}

    public record GuardarDirectivaRequest(
            @NotEmpty(message = "Debe enviar al menos los cargos principales")
            List<GuardarCargoItemRequest> cargos
    ) {}
}
