package com.cajachambala.acciones.application.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public class AccionDtos {

    public record CertificadoAccionDto(
            UUID id,
            Integer numeroCertificado,
            UUID socioId,
            Integer socioCodigo,
            String socioNombre,
            Integer serieInicio,
            Integer serieFin,
            Integer cantidad,
            BigDecimal valorNominal,
            BigDecimal totalMonto,
            LocalDate fechaEmision,
            UUID periodoId,
            UUID operacionId,
            String estado,
            String tipoOrigen,
            UUID certificadoOrigenId,
            String observaciones,
            String socioDocumentoTipo,
            String socioDocumentoNumero,
            Short periodoAnio,
            Short periodoMes,
            LocalDate periodoFechaReunion
    ) {
        public CertificadoAccionDto(
                UUID id,
                Integer numeroCertificado,
                UUID socioId,
                Integer socioCodigo,
                String socioNombre,
                Integer serieInicio,
                Integer serieFin,
                Integer cantidad,
                BigDecimal valorNominal,
                BigDecimal totalMonto,
                LocalDate fechaEmision,
                UUID periodoId,
                UUID operacionId,
                String estado,
                String tipoOrigen,
                UUID certificadoOrigenId,
                String observaciones,
                String socioDocumentoTipo,
                String socioDocumentoNumero
        ) {
            this(id, numeroCertificado, socioId, socioCodigo, socioNombre, serieInicio, serieFin, cantidad, valorNominal, totalMonto, fechaEmision, periodoId, operacionId, estado, tipoOrigen, certificadoOrigenId, observaciones, socioDocumentoTipo, socioDocumentoNumero, null, null, null);
        }

        public CertificadoAccionDto(
                UUID id,
                Integer numeroCertificado,
                UUID socioId,
                Integer socioCodigo,
                String socioNombre,
                Integer serieInicio,
                Integer serieFin,
                Integer cantidad,
                BigDecimal valorNominal,
                BigDecimal totalMonto,
                LocalDate fechaEmision,
                UUID periodoId,
                UUID operacionId,
                String estado,
                String tipoOrigen,
                UUID certificadoOrigenId,
                String observaciones
        ) {
            this(id, numeroCertificado, socioId, socioCodigo, socioNombre, serieInicio, serieFin, cantidad, valorNominal, totalMonto, fechaEmision, periodoId, operacionId, estado, tipoOrigen, certificadoOrigenId, observaciones, "DNI", null, null, null, null);
        }
    }

    public record TransferenciaAccionDto(
            UUID id,
            Integer numeroTransferencia,
            UUID socioOrigenId,
            Integer socioOrigenCodigo,
            String socioOrigenNombre,
            UUID socioDestinoId,
            Integer socioDestinoCodigo,
            String socioDestinoNombre,
            UUID certificadoOrigenId,
            Integer certificadoOrigenNumero,
            UUID certificadoDestinoId,
            Integer certificadoDestinoNumero,
            Integer serieInicio,
            Integer serieFin,
            Integer cantidad,
            BigDecimal precioUnitario,
            BigDecimal totalMonto,
            LocalDate fecha,
            String motivo,
            String documentoActa,
            String observaciones
    ) {}

    public record RegistrarTransferenciaRequest(
            UUID socioOrigenId,       // Opcional si sale de Cartera de Caja
            @NotNull UUID socioDestinoId, // Obligatorio
            @NotNull UUID certificadoOrigenId,
            @NotNull @Positive Integer cantidad,
            BigDecimal precioUnitario, // Por defecto S/ 30.00
            LocalDate fecha,
            String motivo,            // VENTA_ENTRE_SOCIOS, REASIGNACION_CARTERA, etc.
            String documentoActa,
            String observaciones
    ) {}

    public record ResumenMatriculaDto(
            Integer totalAccionesEmitidas,
            Integer totalAccionesActivas,
            Integer totalAccionesDevueltas,
            BigDecimal capitalSocialActivo,
            Integer totalSociosConAcciones,
            Integer totalCertificadosEmitidos,
            Integer maxSerieEmitida
    ) {}

    public record SocioMatriculaDto(
            UUID socioId,
            Integer socioCodigo,
            String socioNombre,
            String socioEstado,
            Integer totalAcciones,
            BigDecimal capitalSocial,
            List<String> rangosSeries,
            Integer totalCertificados
    ) {}
}
