package com.cajachambala.caja.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "cierre_periodo")
public class CierrePeriodo {

    @Id
    @Column(name = "periodo_id")
    private UUID periodoId;

    @Column(name = "saldo_anterior", nullable = false, precision = 14, scale = 2)
    private BigDecimal saldoAnterior;

    @Column(name = "total_ingresos", nullable = false, precision = 14, scale = 2)
    private BigDecimal totalIngresos;

    @Column(name = "total_egresos", nullable = false, precision = 14, scale = 2)
    private BigDecimal totalEgresos;

    @Column(name = "saldo_final", insertable = false, updatable = false, precision = 14, scale = 2)
    private BigDecimal saldoFinal;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    private Map<String, Object> detalle;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "hash_integridad", nullable = false, length = 64)
    private String hashIntegridad;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "created_by")
    private UUID createdBy;

    protected CierrePeriodo() {
    }

    public CierrePeriodo(
            UUID periodoId,
            BigDecimal saldoAnterior,
            BigDecimal totalIngresos,
            BigDecimal totalEgresos,
            Map<String, Object> detalle,
            String hashIntegridad,
            UUID createdBy
    ) {
        this.periodoId = periodoId;
        this.saldoAnterior = saldoAnterior;
        this.totalIngresos = totalIngresos;
        this.totalEgresos = totalEgresos;
        this.detalle = detalle;
        this.hashIntegridad = hashIntegridad;
        this.createdAt = Instant.now();
        this.createdBy = createdBy;
    }

    public UUID getPeriodoId() { return periodoId; }
    public BigDecimal getSaldoAnterior() { return saldoAnterior; }
    public BigDecimal getTotalIngresos() { return totalIngresos; }
    public BigDecimal getTotalEgresos() { return totalEgresos; }
    public BigDecimal getSaldoFinal() {
        return (saldoFinal != null) ? saldoFinal : saldoAnterior.add(totalIngresos).subtract(totalEgresos);
    }
    public Map<String, Object> getDetalle() { return detalle; }
    public String getHashIntegridad() { return hashIntegridad; }
    public Instant getCreatedAt() { return createdAt; }
    public UUID getCreatedBy() { return createdBy; }
}
