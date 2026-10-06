package com.cajachambala.socios.application.dto;

import com.cajachambala.socios.domain.SocioEstado;
import com.cajachambala.socios.domain.SocioTipo;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public class SocioDtos {

    public record CrearSocioRequest(
            SocioTipo tipo,
            @NotBlank(message = "Los nombres son requeridos")
            @Size(max = 100, message = "Los nombres no pueden exceder 100 caracteres")
            String nombres,

            @NotBlank(message = "Los apellidos son requeridos")
            @Size(max = 100, message = "Los apellidos no pueden exceder 100 caracteres")
            String apellidos,

            String documentoTipo,

            @NotBlank(message = "El número de documento es requerido")
            @Size(min = 8, max = 20, message = "El documento debe tener entre 8 y 20 caracteres")
            String numeroDocumento,

            String telefono,
            String email,
            String direccion,
            LocalDate fechaIngreso,
            String notas
    ) {}

    public record ActualizarSocioRequest(
            String nombres,
            String apellidos,
            String telefono,
            String email,
            String direccion,
            String notas
    ) {}

    public record BajaSocioRequest(
            LocalDate fechaRetiro,
            @NotBlank(message = "El motivo de baja es obligatorio")
            String motivo
    ) {}

    public record HabilitarAccesoRequest(
            @NotBlank(message = "El correo electrónico es requerido")
            String email,
            String passwordTemporal
    ) {}

    public record SocioResponse(
            UUID id,
            Integer codigo,
            SocioTipo tipo,
            String nombres,
            String apellidos,
            String nombreCompleto,
            String documentoTipo,
            String documentoEnmascarado,
            String telefono,
            String email,
            String direccion,
            LocalDate fechaIngreso,
            LocalDate fechaRetiro,
            SocioEstado estado,
            String notas,
            boolean tieneAccesoWeb,
            String usuarioStatus
    ) {}
}
