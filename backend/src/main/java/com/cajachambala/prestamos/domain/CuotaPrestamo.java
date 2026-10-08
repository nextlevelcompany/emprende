package com.cajachambala.prestamos.domain;

import com.cajachambala.shared.domain.IdGenerator;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcType;
import org.hibernate.dialect.PostgreSQLEnumJdbcType;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "cuota_prestamo")
public class CuotaPrestamo {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prestamo_id", nullable = false)
    private Prestamo prestamo;

    @Column(name = "nro_cuota", nullable = false)
    private Short nroCuota;

    @Column(name = "fecha_vencimiento", nullable = false)
    private LocalDate fechaVencimiento;

    @Column(name = "capital_programado", nullable = false, precision = 14, scale = 2)
    private BigDecimal capitalProgramado;

    @Column(name = "interes_programado", nullable = false, precision = 14, scale = 2)
    private BigDecimal interesProgramado;

    @Column(name = "cuota_programada", insertable = false, updatable = false, precision = 14, scale = 2)
    private BigDecimal cuotaProgramada;

    @Column(name = "capital_pagado", nullable = false, precision = 14, scale = 2)
    private BigDecimal capitalPagado;

    @Column(name = "interes_pagado", nullable = false, precision = 14, scale = 2)
    private BigDecimal interesPagado;

    @Column(name = "mora_pagada", nullable = false, precision = 14, scale = 2)
    private BigDecimal moraPagada;

    @Enumerated(EnumType.STRING)
    @JdbcType(PostgreSQLEnumJdbcType.class)
    @Column(nullable = false)
    private CuotaEstado estado;

    @Column(name = "fecha_pago")
    private LocalDate fechaPago;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected CuotaPrestamo() {
    }

    public CuotaPrestamo(
            Prestamo prestamo,
            Short nroCuota,
            LocalDate fechaVencimiento,
            BigDecimal capitalProgramado,
            BigDecimal interesProgramado
    ) {
        this.id = IdGenerator.nextId();
        this.prestamo = prestamo;
        this.nroCuota = nroCuota;
        this.fechaVencimiento = fechaVencimiento;
        this.capitalProgramado = capitalProgramado;
        this.interesProgramado = interesProgramado;
        this.capitalPagado = BigDecimal.ZERO.setScale(2);
        this.interesPagado = BigDecimal.ZERO.setScale(2);
        this.moraPagada = BigDecimal.ZERO.setScale(2);
        this.estado = CuotaEstado.PENDIENTE;
        this.updatedAt = Instant.now();
    }

    public void asignarPrestamo(Prestamo prestamo) {
        this.prestamo = prestamo;
    }

    public void abonar(BigDecimal abonoCapital, BigDecimal abonoInteres, BigDecimal abonoMora, LocalDate fechaPago) {
        if (abonoCapital != null && abonoCapital.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal nuevoCapital = this.capitalPagado.add(abonoCapital);
            if (nuevoCapital.compareTo(this.capitalProgramado) > 0) {
                throw new IllegalArgumentException("El capital pagado no puede superar el capital programado de la cuota");
            }
            this.capitalPagado = nuevoCapital;
        }

        if (abonoInteres != null && abonoInteres.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal nuevoInteres = this.interesPagado.add(abonoInteres);
            if (nuevoInteres.compareTo(this.interesProgramado) > 0) {
                throw new IllegalArgumentException("El interés pagado no puede superar el interés programado de la cuota");
            }
            this.interesPagado = nuevoInteres;
        }

        if (abonoMora != null && abonoMora.compareTo(BigDecimal.ZERO) > 0) {
            this.moraPagada = this.moraPagada.add(abonoMora);
        }

        this.fechaPago = fechaPago != null ? fechaPago : LocalDate.now();
        this.updatedAt = Instant.now();

        // Determinar estado de la cuota
        boolean capitalCompleto = this.capitalPagado.compareTo(this.capitalProgramado) >= 0;
        boolean interesCompleto = this.interesPagado.compareTo(this.interesProgramado) >= 0;

        if (capitalCompleto && interesCompleto) {
            this.estado = CuotaEstado.PAGADA;
        } else if (this.capitalPagado.compareTo(BigDecimal.ZERO) > 0 || this.interesPagado.compareTo(BigDecimal.ZERO) > 0) {
            this.estado = CuotaEstado.PARCIAL;
        }
    }

    public void revertirPago() {
        this.capitalPagado = BigDecimal.ZERO.setScale(2);
        this.interesPagado = BigDecimal.ZERO.setScale(2);
        this.moraPagada = BigDecimal.ZERO.setScale(2);
        this.fechaPago = null;
        this.estado = CuotaEstado.PENDIENTE;
        this.updatedAt = Instant.now();
    }

    public void fijarPago(BigDecimal capital, BigDecimal interes, BigDecimal mora, LocalDate fecha) {
        BigDecimal nuevoCapital = capital != null ? capital.setScale(2, java.math.RoundingMode.HALF_UP) : BigDecimal.ZERO.setScale(2);
        BigDecimal nuevoInteres = interes != null ? interes.setScale(2, java.math.RoundingMode.HALF_UP) : BigDecimal.ZERO.setScale(2);
        if (nuevoCapital.compareTo(this.capitalProgramado) > 0) {
            throw new IllegalArgumentException("El capital pagado no puede superar el capital programado de la cuota");
        }
        if (nuevoInteres.compareTo(this.interesProgramado) > 0) {
            throw new IllegalArgumentException("El interés pagado no puede superar el interés programado de la cuota");
        }

        this.capitalPagado = nuevoCapital;
        this.interesPagado = nuevoInteres;
        this.moraPagada = mora != null ? mora.setScale(2, java.math.RoundingMode.HALF_UP) : BigDecimal.ZERO.setScale(2);
        this.fechaPago = (this.capitalPagado.compareTo(BigDecimal.ZERO) > 0 || this.interesPagado.compareTo(BigDecimal.ZERO) > 0) ? (fecha != null ? fecha : LocalDate.now()) : null;
        this.updatedAt = Instant.now();

        boolean capOk = this.capitalPagado.compareTo(this.capitalProgramado) >= 0;
        boolean intOk = this.interesPagado.compareTo(this.interesProgramado) >= 0;
        if (capOk && intOk) {
            this.estado = CuotaEstado.PAGADA;
        } else if (this.capitalPagado.compareTo(BigDecimal.ZERO) > 0 || this.interesPagado.compareTo(BigDecimal.ZERO) > 0) {
            this.estado = CuotaEstado.PARCIAL;
        } else {
            this.estado = CuotaEstado.PENDIENTE;
        }
    }

    public void actualizarVencimientoSiAplica(LocalDate fechaActual) {
        if ((this.estado == CuotaEstado.PENDIENTE || this.estado == CuotaEstado.PARCIAL) && fechaActual.isAfter(this.fechaVencimiento)) {
            this.estado = CuotaEstado.VENCIDA;
            this.updatedAt = Instant.now();
        }
    }

    // Getters y Setters
    public UUID getId() { return id; }
    public Prestamo getPrestamo() { return prestamo; }
    public Short getNroCuota() { return nroCuota; }
    public LocalDate getFechaVencimiento() { return fechaVencimiento; }
    public BigDecimal getCapitalProgramado() { return capitalProgramado; }
    public BigDecimal getInteresProgramado() { return interesProgramado; }
    public BigDecimal getCuotaProgramada() {
        return cuotaProgramada != null ? cuotaProgramada : capitalProgramado.add(interesProgramado);
    }
    public BigDecimal getCapitalPagado() { return capitalPagado; }
    public BigDecimal getInteresPagado() { return interesPagado; }
    public BigDecimal getMoraPagada() { return moraPagada; }
    public CuotaEstado getEstado() { return estado; }
    public LocalDate getFechaPago() { return fechaPago; }
    public Instant getUpdatedAt() { return updatedAt; }

    public BigDecimal getSaldoCapitalPendiente() {
        return capitalProgramado.subtract(capitalPagado);
    }

    public BigDecimal getSaldoInteresPendiente() {
        return interesProgramado.subtract(interesPagado);
    }

    public BigDecimal getTotalPendiente() {
        return getSaldoCapitalPendiente().add(getSaldoInteresPendiente());
    }
}
