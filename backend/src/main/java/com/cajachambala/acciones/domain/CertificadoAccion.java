package com.cajachambala.acciones.domain;

import com.cajachambala.shared.domain.IdGenerator;
import com.cajachambala.socios.domain.Socio;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "certificado_accion")
public class CertificadoAccion {

    @Id
    private UUID id;

    @Column(name = "caja_id", nullable = false)
    private UUID cajaId;

    @Column(name = "numero_certificado", nullable = false)
    private Integer numeroCertificado;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "socio_id")
    private Socio socio;

    @Column(name = "serie_inicio", nullable = false)
    private Integer serieInicio;

    @Column(name = "serie_fin", nullable = false)
    private Integer serieFin;

    @Column(nullable = false)
    private Integer cantidad;

    @Column(name = "valor_nominal", nullable = false, precision = 10, scale = 2)
    private BigDecimal valorNominal;

    @Column(name = "total_monto", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalMonto;

    @Column(name = "fecha_emision", nullable = false)
    private LocalDate fechaEmision;

    @Column(name = "periodo_id")
    private UUID periodoId;

    @Column(name = "operacion_id")
    private UUID operacionId;

    @Column(nullable = false, length = 20)
    private String estado; // ACTIVO, TRANSFERIDO, DEVUELTO_RETIRO, EN_CARTERA, ANULADO

    @Column(name = "tipo_origen", nullable = false, length = 30)
    private String tipoOrigen; // APORTE_MENSUAL, EMISION_INICIAL, TRASPASO_VENTA, DESDOBLAMIENTO

    @Column(name = "certificado_origen_id")
    private UUID certificadoOrigenId;

    @Column(columnDefinition = "text")
    private String observaciones;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "created_by")
    private UUID createdBy;

    protected CertificadoAccion() {
    }

    public CertificadoAccion(
            UUID cajaId,
            Integer numeroCertificado,
            Socio socio,
            Integer serieInicio,
            Integer serieFin,
            BigDecimal valorNominal,
            LocalDate fechaEmision,
            UUID periodoId,
            UUID operacionId,
            String estado,
            String tipoOrigen,
            UUID certificadoOrigenId,
            String observaciones,
            UUID createdBy
    ) {
        this.id = IdGenerator.nuevo();
        this.cajaId = cajaId;
        this.numeroCertificado = numeroCertificado;
        this.socio = socio;
        this.serieInicio = serieInicio;
        this.serieFin = serieFin;
        this.cantidad = serieFin - serieInicio + 1;
        this.valorNominal = valorNominal != null ? valorNominal : BigDecimal.valueOf(30.00);
        this.totalMonto = this.valorNominal.multiply(BigDecimal.valueOf(this.cantidad));
        this.fechaEmision = fechaEmision;
        this.periodoId = periodoId;
        this.operacionId = operacionId;
        this.estado = estado != null ? estado : "ACTIVO";
        this.tipoOrigen = tipoOrigen != null ? tipoOrigen : "APORTE_MENSUAL";
        this.certificadoOrigenId = certificadoOrigenId;
        this.observaciones = observaciones;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
        this.createdBy = createdBy;
    }

    public void marcarTransferido(String obs) {
        this.estado = "TRANSFERIDO";
        this.updatedAt = Instant.now();
        if (obs != null && !obs.isBlank()) {
            this.observaciones = (this.observaciones != null ? this.observaciones + " | " : "") + obs;
        }
    }

    public void marcarDevueltoRetiro(String obs) {
        this.estado = "DEVUELTO_RETIRO";
        this.updatedAt = Instant.now();
        if (obs != null && !obs.isBlank()) {
            this.observaciones = (this.observaciones != null ? this.observaciones + " | " : "") + obs;
        }
    }

    public void pasarACartera(String obs) {
        this.estado = "EN_CARTERA";
        this.socio = null;
        this.updatedAt = Instant.now();
        if (obs != null && !obs.isBlank()) {
            this.observaciones = (this.observaciones != null ? this.observaciones + " | " : "") + obs;
        }
    }

    public void actualizarRango(Integer nuevoFin) {
        this.serieFin = nuevoFin;
        this.cantidad = nuevoFin - this.serieInicio + 1;
        this.totalMonto = this.valorNominal.multiply(BigDecimal.valueOf(this.cantidad));
        this.updatedAt = Instant.now();
    }

    // Getters
    public UUID getId() { return id; }
    public UUID getCajaId() { return cajaId; }
    public Integer getNumeroCertificado() { return numeroCertificado; }
    public Socio getSocio() { return socio; }
    public Integer getSerieInicio() { return serieInicio; }
    public Integer getSerieFin() { return serieFin; }
    public Integer getCantidad() { return cantidad; }
    public BigDecimal getValorNominal() { return valorNominal; }
    public BigDecimal getTotalMonto() { return totalMonto; }
    public LocalDate getFechaEmision() { return fechaEmision; }
    public UUID getPeriodoId() { return periodoId; }
    public UUID getOperacionId() { return operacionId; }
    public String getEstado() { return estado; }
    public String getTipoOrigen() { return tipoOrigen; }
    public UUID getCertificadoOrigenId() { return certificadoOrigenId; }
    public String getObservaciones() { return observaciones; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public UUID getCreatedBy() { return createdBy; }
}
