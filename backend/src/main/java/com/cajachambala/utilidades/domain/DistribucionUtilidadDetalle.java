package com.cajachambala.utilidades.domain;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "distribucion_utilidad_detalle")
public class DistribucionUtilidadDetalle {

    @EmbeddedId
    private DistribucionDetalleId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("distribucionId")
    @JoinColumn(name = "distribucion_id", nullable = false)
    private DistribucionUtilidad distribucion;

    @Column(nullable = false)
    private Integer acciones;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal monto;

    @Column(name = "monto_cobrado", precision = 14, scale = 2)
    private BigDecimal montoCobrado;

    @Column(name = "monto_reinvertido", precision = 14, scale = 2)
    private BigDecimal montoReinvertido;

    @Column(name = "acciones_compradas")
    private Integer accionesCompradas;

    @Column(name = "modalidad", length = 30)
    private String modalidad;

    @Column(name = "operacion_id")
    private UUID operacionId;

    protected DistribucionUtilidadDetalle() {
    }

    public DistribucionUtilidadDetalle(
            UUID distribucionId,
            UUID socioId,
            Integer acciones,
            BigDecimal monto
    ) {
        this(distribucionId, socioId, acciones, monto, monto, BigDecimal.ZERO, 0, "EFECTIVO");
    }

    public DistribucionUtilidadDetalle(
            UUID distribucionId,
            UUID socioId,
            Integer acciones,
            BigDecimal monto,
            BigDecimal montoCobrado,
            BigDecimal montoReinvertido,
            Integer accionesCompradas,
            String modalidad
    ) {
        this.id = new DistribucionDetalleId(distribucionId, socioId);
        this.acciones = acciones;
        this.monto = monto;
        this.montoCobrado = montoCobrado != null ? montoCobrado : monto;
        this.montoReinvertido = montoReinvertido != null ? montoReinvertido : BigDecimal.ZERO;
        this.accionesCompradas = accionesCompradas != null ? accionesCompradas : 0;
        this.modalidad = (modalidad != null && !modalidad.isBlank()) ? modalidad : "EFECTIVO";
    }

    public void asignarDistribucion(DistribucionUtilidad distribucion) {
        this.distribucion = distribucion;
        if (this.id != null) {
            this.id.setDistribucionId(distribucion.getId());
        }
    }

    public void registrarPagoOperacion(UUID operacionId) {
        this.operacionId = operacionId;
    }

    public DistribucionDetalleId getId() { return id; }
    public DistribucionUtilidad getDistribucion() { return distribucion; }
    public UUID getSocioId() { return (id != null) ? id.getSocioId() : null; }
    public Integer getAcciones() { return acciones; }
    public BigDecimal getMonto() { return monto; }
    public BigDecimal getMontoCobrado() { return montoCobrado != null ? montoCobrado : monto; }
    public BigDecimal getMontoReinvertido() { return montoReinvertido != null ? montoReinvertido : BigDecimal.ZERO; }
    public Integer getAccionesCompradas() { return accionesCompradas != null ? accionesCompradas : 0; }
    public String getModalidad() { return modalidad != null ? modalidad : "EFECTIVO"; }
    public UUID getOperacionId() { return operacionId; }
}
