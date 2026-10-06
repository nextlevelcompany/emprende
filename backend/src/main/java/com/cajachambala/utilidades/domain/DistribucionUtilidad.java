package com.cajachambala.utilidades.domain;

import com.cajachambala.shared.domain.IdGenerator;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcType;
import org.hibernate.dialect.PostgreSQLEnumJdbcType;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "distribucion_utilidad")
public class DistribucionUtilidad {

    @Id
    private UUID id;

    @Column(name = "caja_id", nullable = false)
    private UUID cajaId;

    @Column(nullable = false)
    private Short ejercicio;

    @Column(name = "fecha_corte", nullable = false)
    private LocalDate fechaCorte;

    @Column(name = "utilidad_total", nullable = false, precision = 14, scale = 2)
    private BigDecimal utilidadTotal;

    @Column(name = "total_acciones", nullable = false)
    private Integer totalAcciones;

    @Column(name = "valor_por_accion", insertable = false, updatable = false, precision = 14, scale = 6)
    private BigDecimal valorPorAccion;

    @Enumerated(EnumType.STRING)
    @JdbcType(PostgreSQLEnumJdbcType.class)
    @Column(nullable = false)
    private DistribucionEstado estado;

    @Column(name = "aprobado_por")
    private UUID aprobadoPor;

    @Column(name = "aprobado_at")
    private Instant aprobadoAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @OneToMany(mappedBy = "distribucion", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DistribucionUtilidadDetalle> detalles = new ArrayList<>();

    protected DistribucionUtilidad() {
    }

    public DistribucionUtilidad(
            UUID cajaId,
            Short ejercicio,
            LocalDate fechaCorte,
            BigDecimal utilidadTotal,
            Integer totalAcciones
    ) {
        this.id = IdGenerator.nextId();
        this.cajaId = cajaId;
        this.ejercicio = ejercicio;
        this.fechaCorte = fechaCorte;
        this.utilidadTotal = utilidadTotal;
        this.totalAcciones = totalAcciones;
        this.estado = DistribucionEstado.BORRADOR;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public void actualizar(BigDecimal utilidadTotal, Integer totalAcciones, LocalDate fechaCorte) {
        if (this.estado != DistribucionEstado.BORRADOR) {
            throw new IllegalStateException("Solo se puede modificar una distribución en estado BORRADOR");
        }
        this.utilidadTotal = utilidadTotal;
        this.totalAcciones = totalAcciones;
        if (fechaCorte != null) {
            this.fechaCorte = fechaCorte;
        }
        this.updatedAt = Instant.now();
    }

    public void aprobar(UUID userId) {
        if (this.estado != DistribucionEstado.BORRADOR) {
            throw new IllegalStateException("Solo una distribución en BORRADOR puede ser aprobada");
        }
        this.estado = DistribucionEstado.APROBADA;
        this.aprobadoPor = userId;
        this.aprobadoAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public void marcarPagada() {
        if (this.estado != DistribucionEstado.APROBADA) {
            throw new IllegalStateException("La distribución debe estar APROBADA para poder ser marcada como pagada");
        }
        this.estado = DistribucionEstado.PAGADA;
        this.updatedAt = Instant.now();
    }

    public void agregarDetalle(DistribucionUtilidadDetalle det) {
        this.detalles.add(det);
        det.asignarDistribucion(this);
    }

    public void limpiarDetalles() {
        this.detalles.clear();
    }

    // Getters
    public UUID getId() { return id; }
    public UUID getCajaId() { return cajaId; }
    public Short getEjercicio() { return ejercicio; }
    public LocalDate getFechaCorte() { return fechaCorte; }
    public BigDecimal getUtilidadTotal() { return utilidadTotal; }
    public Integer getTotalAcciones() { return totalAcciones; }
    public BigDecimal getValorPorAccion() {
        if (valorPorAccion != null) return valorPorAccion;
        if (totalAcciones != null && totalAcciones > 0 && utilidadTotal != null) {
            return utilidadTotal.divide(BigDecimal.valueOf(totalAcciones), 6, java.math.RoundingMode.HALF_UP);
        }
        return BigDecimal.ZERO;
    }
    public DistribucionEstado getEstado() { return estado; }
    public UUID getAprobadoPor() { return aprobadoPor; }
    public Instant getAprobadoAt() { return aprobadoAt; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public List<DistribucionUtilidadDetalle> getDetalles() { return detalles; }
}
