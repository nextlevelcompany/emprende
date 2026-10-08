package com.cajachambala.acciones.domain;

import com.cajachambala.shared.domain.IdGenerator;
import com.cajachambala.socios.domain.Socio;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "transferencia_accion")
public class TransferenciaAccion {

    @Id
    private UUID id;

    @Column(name = "caja_id", nullable = false)
    private UUID cajaId;

    @Column(name = "numero_transferencia", nullable = false)
    private Integer numeroTransferencia;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "socio_origen_id")
    private Socio socioOrigen;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "socio_destino_id")
    private Socio socioDestino;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "certificado_origen_id")
    private CertificadoAccion certificadoOrigen;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "certificado_destino_id")
    private CertificadoAccion certificadoDestino;

    @Column(name = "serie_inicio", nullable = false)
    private Integer serieInicio;

    @Column(name = "serie_fin", nullable = false)
    private Integer serieFin;

    @Column(nullable = false)
    private Integer cantidad;

    @Column(name = "precio_unitario", nullable = false, precision = 10, scale = 2)
    private BigDecimal precioUnitario;

    @Column(name = "total_monto", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalMonto;

    @Column(nullable = false)
    private LocalDate fecha;

    @Column(name = "periodo_id")
    private UUID periodoId;

    @Column(name = "operacion_id")
    private UUID operacionId;

    @Column(nullable = false, length = 50)
    private String motivo; // RETIRO_SOCIO, VENTA_ENTRE_SOCIOS, DEVOLUCION_CAPITAL, REASIGNACION_CARTERA

    @Column(name = "documento_acta", length = 100)
    private String documentoActa;

    @Column(columnDefinition = "text")
    private String observaciones;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "created_by")
    private UUID createdBy;

    protected TransferenciaAccion() {
    }

    public TransferenciaAccion(
            UUID cajaId,
            Integer numeroTransferencia,
            Socio socioOrigen,
            Socio socioDestino,
            CertificadoAccion certificadoOrigen,
            CertificadoAccion certificadoDestino,
            Integer serieInicio,
            Integer serieFin,
            BigDecimal precioUnitario,
            LocalDate fecha,
            UUID periodoId,
            UUID operacionId,
            String motivo,
            String documentoActa,
            String observaciones,
            UUID createdBy
    ) {
        this.id = IdGenerator.nuevo();
        this.cajaId = cajaId;
        this.numeroTransferencia = numeroTransferencia;
        this.socioOrigen = socioOrigen;
        this.socioDestino = socioDestino;
        this.certificadoOrigen = certificadoOrigen;
        this.certificadoDestino = certificadoDestino;
        this.serieInicio = serieInicio;
        this.serieFin = serieFin;
        this.cantidad = serieFin - serieInicio + 1;
        this.precioUnitario = precioUnitario != null ? precioUnitario : BigDecimal.valueOf(30.00);
        this.totalMonto = this.precioUnitario.multiply(BigDecimal.valueOf(this.cantidad));
        this.fecha = fecha;
        this.periodoId = periodoId;
        this.operacionId = operacionId;
        this.motivo = motivo;
        this.documentoActa = documentoActa;
        this.observaciones = observaciones;
        this.createdAt = Instant.now();
        this.createdBy = createdBy;
    }

    // Getters
    public UUID getId() { return id; }
    public UUID getCajaId() { return cajaId; }
    public Integer getNumeroTransferencia() { return numeroTransferencia; }
    public Socio getSocioOrigen() { return socioOrigen; }
    public Socio getSocioDestino() { return socioDestino; }
    public CertificadoAccion getCertificadoOrigen() { return certificadoOrigen; }
    public CertificadoAccion getCertificadoDestino() { return certificadoDestino; }
    public Integer getSerieInicio() { return serieInicio; }
    public Integer getSerieFin() { return serieFin; }
    public Integer getCantidad() { return cantidad; }
    public BigDecimal getPrecioUnitario() { return precioUnitario; }
    public BigDecimal getTotalMonto() { return totalMonto; }
    public LocalDate getFecha() { return fecha; }
    public UUID getPeriodoId() { return periodoId; }
    public UUID getOperacionId() { return operacionId; }
    public String getMotivo() { return motivo; }
    public String getDocumentoActa() { return documentoActa; }
    public String getObservaciones() { return observaciones; }
    public Instant getCreatedAt() { return createdAt; }
    public UUID getCreatedBy() { return createdBy; }
}
