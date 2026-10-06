package com.cajachambala.caja.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "arqueo_caja")
public class ArqueoCaja {

    @Id
    @Column(name = "periodo_id")
    private UUID periodoId;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal efectivo;

    @Column(name = "depositos_bancos", nullable = false, precision = 14, scale = 2)
    private BigDecimal depositosBancos;

    @Column(name = "total_contado", insertable = false, updatable = false, precision = 14, scale = 2)
    private BigDecimal totalContado;

    @Column(name = "saldo_sistema", nullable = false, precision = 14, scale = 2)
    private BigDecimal saldoSistema;

    @Column(insertable = false, updatable = false, precision = 14, scale = 2)
    private BigDecimal diferencia;

    @Column(columnDefinition = "text")
    private String observacion;

    @Column(name = "registrado_por")
    private UUID registradoPor;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected ArqueoCaja() {
    }

    public ArqueoCaja(
            UUID periodoId,
            BigDecimal efectivo,
            BigDecimal depositosBancos,
            BigDecimal saldoSistema,
            String observacion,
            UUID registradoPor
    ) {
        this.periodoId = periodoId;
        this.efectivo = (efectivo != null) ? efectivo : BigDecimal.ZERO;
        this.depositosBancos = (depositosBancos != null) ? depositosBancos : BigDecimal.ZERO;
        this.saldoSistema = saldoSistema;
        this.observacion = observacion;
        this.registradoPor = registradoPor;
        this.createdAt = Instant.now();
    }

    public void actualizar(BigDecimal efectivo, BigDecimal depositosBancos, BigDecimal saldoSistema, String observacion) {
        this.efectivo = (efectivo != null) ? efectivo : BigDecimal.ZERO;
        this.depositosBancos = (depositosBancos != null) ? depositosBancos : BigDecimal.ZERO;
        this.saldoSistema = saldoSistema;
        this.observacion = observacion;
    }

    public UUID getPeriodoId() { return periodoId; }
    public BigDecimal getEfectivo() { return efectivo; }
    public BigDecimal getDepositosBancos() { return depositosBancos; }
    public BigDecimal getTotalContado() {
        return (totalContado != null) ? totalContado : efectivo.add(depositosBancos);
    }
    public BigDecimal getSaldoSistema() { return saldoSistema; }
    public BigDecimal getDiferencia() {
        return (diferencia != null) ? diferencia : getTotalContado().subtract(saldoSistema);
    }
    public String getObservacion() { return observacion; }
    public UUID getRegistradoPor() { return registradoPor; }
    public Instant getCreatedAt() { return createdAt; }
}
