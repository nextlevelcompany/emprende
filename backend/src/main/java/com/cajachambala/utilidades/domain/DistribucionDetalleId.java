package com.cajachambala.utilidades.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

@Embeddable
public class DistribucionDetalleId implements Serializable {

    @Column(name = "distribucion_id", nullable = false)
    private UUID distribucionId;

    @Column(name = "socio_id", nullable = false)
    private UUID socioId;

    public DistribucionDetalleId() {
    }

    public DistribucionDetalleId(UUID distribucionId, UUID socioId) {
        this.distribucionId = distribucionId;
        this.socioId = socioId;
    }

    public UUID getDistribucionId() { return distribucionId; }
    public void setDistribucionId(UUID distribucionId) { this.distribucionId = distribucionId; }

    public UUID getSocioId() { return socioId; }
    public void setSocioId(UUID socioId) { this.socioId = socioId; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof DistribucionDetalleId that)) return false;
        return Objects.equals(distribucionId, that.distribucionId) && Objects.equals(socioId, that.socioId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(distribucionId, socioId);
    }
}
