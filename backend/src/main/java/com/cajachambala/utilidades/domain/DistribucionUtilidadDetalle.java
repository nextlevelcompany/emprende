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
        this.id = new DistribucionDetalleId(distribucionId, socioId);
        this.acciones = acciones;
        this.monto = monto;
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
    public UUID getOperacionId() { return operacionId; }
}
