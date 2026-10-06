package com.cajachambala.reportes.application.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public class ReportesDtos {

    // ==========================================
    // 1. DASHBOARD DE MÉTRICAS & ANALYTICS
    // ==========================================

    public record DashboardMetricasResponse(
            KpisGlobalesDto kpis,
            List<PeriodoEvolucionDto> evolucionMensual,
            List<ConceptoMontoDto> conceptosIngreso,
            List<ConceptoMontoDto> conceptosEgreso,
            CarteraKpisDto cartera
    ) {}

    public record KpisGlobalesDto(
            BigDecimal saldoCajaActual,
            BigDecimal totalIngresosHistorico,
            BigDecimal totalEgresosHistorico,
            BigDecimal totalInteresesCobrados,
            int sociosActivos,
            int totalAcciones,
            BigDecimal capitalSocialTotal,
            BigDecimal carteraColocada,
            BigDecimal carteraSaldoPendiente,
            BigDecimal utilidadUltimoEjercicio,
            BigDecimal dividendoPorAccionUltimo
    ) {}

    public record PeriodoEvolucionDto(
            UUID periodoId,
            Short anio,
            Short mes,
            String etiqueta,
            String estado,
            BigDecimal ingresos,
            BigDecimal egresos,
            BigDecimal saldoAnterior,
            BigDecimal saldoFinal,
            BigDecimal intereses,
            BigDecimal prestamos,
            BigDecimal pagosCapital,
            BigDecimal acciones,
            BigDecimal utilidadDistribuida
    ) {}

    public record ConceptoMontoDto(
            String codigo,
            String nombre,
            BigDecimal total
    ) {}

    public record CarteraKpisDto(
            long totalPrestamos,
            long vigentes,
            long cancelados,
            BigDecimal montoTotalColocado,
            BigDecimal montoTotalRecuperado,
            BigDecimal montoSaldoPendiente,
            BigDecimal porcentajeRecuperacion
    ) {}

    // ==========================================
    // 2. REPORTE DE ASAMBLEA (LIBRO DE CAJA)
    // ==========================================

    public record ReporteAsambleaResponse(
            CabeceraAsambleaDto cabecera,
            IngresosDesgloseDto ingresosDesglose,
            EgresosDesgloseDto egresosDesglose,
            List<OperacionResumenDto> operaciones,
            ArqueoResumenDto arqueo
    ) {}

    public record CabeceraAsambleaDto(
            UUID periodoId,
            Short anio,
            Short mes,
            String nombreMes,
            LocalDate fechaReunion,
            String estado,
            BigDecimal saldoAnterior,
            BigDecimal totalIngresos,
            BigDecimal totalEgresos,
            BigDecimal saldoFinal,
            Instant cerradoAt,
            String cerradoPor
    ) {}

    public record IngresosDesgloseDto(
            BigDecimal depositoAhorros,
            BigDecimal pagosCapital,
            BigDecimal interesesRecibidos,
            BigDecimal acciones,
            BigDecimal otrosTardanza,
            BigDecimal reservas,
            BigDecimal totalIngresos
    ) {}

    public record EgresosDesgloseDto(
            BigDecimal retirosAhorros,
            BigDecimal prestamos,
            BigDecimal interesPagado,
            BigDecimal gastosAdmin,
            BigDecimal utilidadDistribuida,
            BigDecimal red,
            BigDecimal otrosEgresos,
            BigDecimal totalEgresos
    ) {}

    public record OperacionResumenDto(
            UUID id,
            Integer nroRecibo,
            LocalDate fecha,
            Integer socioCodigo,
            String socioNombre,
            String tipo,
            String concepto,
            BigDecimal monto,
            String descripcion
    ) {}

    public record ArqueoResumenDto(
            BigDecimal efectivo,
            BigDecimal depositosBancos,
            BigDecimal totalContado,
            BigDecimal saldoSistema,
            BigDecimal diferencia,
            String observacion
    ) {}

    // ==========================================
    // 3. ESTADO DE CUENTA INDIVIDUAL POR SOCIO
    // ==========================================

    public record ReporteSocioEstadoCuentaResponse(
            SocioPerfilDto socio,
            ResumenFinancieroSocioDto resumenFinanciero,
            List<SocioPrestamoHistorialDto> prestamos,
            List<SocioUtilidadHistorialDto> utilidades,
            List<SocioMovimientoDto> movimientos
    ) {}

    public record SocioPerfilDto(
            UUID id,
            Integer codigo,
            String nombres,
            String apellidos,
            String nombreCompleto,
            String documentoTipo,
            String documentoNumero,
            String telefono,
            String estado,
            LocalDate fechaIngreso
    ) {}

    public record ResumenFinancieroSocioDto(
            int nroAcciones,
            BigDecimal capitalAcciones,
            BigDecimal saldoAhorros,
            BigDecimal totalPrestamosSolicitados,
            BigDecimal saldoPrestamosPendiente,
            BigDecimal totalUtilidadesRecibidas
    ) {}

    public record SocioPrestamoHistorialDto(
            UUID prestamoId,
            Integer numero,
            LocalDate fechaDesembolso,
            BigDecimal montoPrincipal,
            BigDecimal tasaMensual,
            int nroCuotas,
            String estado,
            BigDecimal saldoCapital
    ) {}

    public record SocioUtilidadHistorialDto(
            Short ejercicio,
            int acciones,
            BigDecimal monto,
            Instant fechaPago
    ) {}

    public record SocioMovimientoDto(
            LocalDate fecha,
            Integer nroRecibo,
            String tipo,
            String concepto,
            BigDecimal monto,
            String descripcion
    ) {}
}
