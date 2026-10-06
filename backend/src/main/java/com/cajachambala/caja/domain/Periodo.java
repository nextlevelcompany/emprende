package com.cajachambala.caja.domain;

import com.cajachambala.shared.domain.IdGenerator;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcType;
import org.hibernate.dialect.PostgreSQLEnumJdbcType;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "periodo")
public class Periodo {

    @Id
    private UUID id;

    @Column(name = "caja_id", nullable = false)
    private UUID cajaId;

    @Column(nullable = false)
    private Short anio;

    @Column(nullable = false)
    private Short mes;

    @Column(name = "fecha_reunion", nullable = false)
    private LocalDate fechaReunion;

    @Enumerated(EnumType.STRING)
    @JdbcType(PostgreSQLEnumJdbcType.class)
    @Column(nullable = false)
    private PeriodoEstado estado;

    @Column(name = "cerrado_at")
    private Instant cerradoAt;

    @Column(name = "cerrado_por")
    private UUID cerradoPor;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Periodo() {
    }

    public Periodo(UUID cajaId, Short anio, Short mes, LocalDate fechaReunion) {
        this.id = IdGenerator.nextId();
        this.cajaId = cajaId;
        this.anio = anio;
        this.mes = mes;
        this.fechaReunion = fechaReunion;
        this.estado = PeriodoEstado.ABIERTO;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public void cerrar(UUID userId) {
        if (this.estado == PeriodoEstado.CERRADO) {
            throw new IllegalStateException("El periodo ya se encuentra cerrado");
        }
        this.estado = PeriodoEstado.CERRADO;
        this.cerradoAt = Instant.now();
        this.cerradoPor = userId;
        this.updatedAt = Instant.now();
    }

    public void reabrir() {
        if (this.estado != PeriodoEstado.CERRADO) {
            throw new IllegalStateException("Solo se pueden reabrir periodos que estén cerrados");
        }
        this.estado = PeriodoEstado.ABIERTO;
        this.cerradoAt = null;
        this.cerradoPor = null;
        this.updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getCajaId() { return cajaId; }
    public Short getAnio() { return anio; }
    public Short getMes() { return mes; }
    public LocalDate getFechaReunion() { return fechaReunion; }
    public PeriodoEstado getEstado() { return estado; }
    public Instant getCerradoAt() { return cerradoAt; }
    public UUID getCerradoPor() { return cerradoPor; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
