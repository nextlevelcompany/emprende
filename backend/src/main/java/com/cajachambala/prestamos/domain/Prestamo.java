package com.cajachambala.prestamos.domain;

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
@Table(name = "prestamo")
public class Prestamo {

    @Id
    private UUID id;

    @Column(name = "caja_id", nullable = false)
    private UUID cajaId;

    @Column(name = "socio_id", nullable = false)
    private UUID socioId;

    @Column(nullable = false)
    private Integer numero;

    @Column(name = "monto_principal", nullable = false, precision = 14, scale = 2)
    private BigDecimal montoPrincipal;

    @Column(name = "tasa_mensual", nullable = false, precision = 6, scale = 4)
    private BigDecimal tasaMensual;

    @Column(name = "nro_cuotas", nullable = false)
    private Short nroCuotas;

    @Column(name = "metodo_amortizacion", nullable = false, length = 40)
    private String metodoAmortizacion = "CAPITAL_FIJO_INTERES_SOBRE_SALDO";

    @Column(name = "fecha_desembolso", nullable = false)
    private LocalDate fechaDesembolso;

    @Column(name = "fecha_primera_cuota", nullable = false)
    private LocalDate fechaPrimeraCuota;

    @Enumerated(EnumType.STRING)
    @JdbcType(PostgreSQLEnumJdbcType.class)
    @Column(nullable = false)
    private PrestamoEstado estado;

    @Column(columnDefinition = "text")
    private String proposito;

    @Column(name = "aprobado_por")
    private UUID aprobadoPor;

    @Column(name = "aprobado_at")
    private Instant aprobadoAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "created_by")
    private UUID createdBy;

    @OneToMany(mappedBy = "prestamo", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("nroCuota ASC")
    private List<CuotaPrestamo> cuotas = new ArrayList<>();

    protected Prestamo() {
    }

    public Prestamo(
            UUID cajaId,
            UUID socioId,
            Integer numero,
            BigDecimal montoPrincipal,
            BigDecimal tasaMensual,
            Short nroCuotas,
            LocalDate fechaDesembolso,
            LocalDate fechaPrimeraCuota,
            String proposito,
            UUID createdBy
    ) {
        this.id = IdGenerator.nextId();
        this.cajaId = cajaId;
        this.socioId = socioId;
        this.numero = numero;
        this.montoPrincipal = montoPrincipal;
        this.tasaMensual = tasaMensual;
        this.nroCuotas = nroCuotas;
        this.metodoAmortizacion = "CAPITAL_FIJO_INTERES_SOBRE_SALDO";
        this.fechaDesembolso = fechaDesembolso;
        this.fechaPrimeraCuota = fechaPrimeraCuota;
        this.estado = PrestamoEstado.SOLICITADO;
        this.proposito = proposito;
        this.createdBy = createdBy;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public void aprobar(UUID adminUserId) {
        if (this.estado != PrestamoEstado.SOLICITADO) {
            throw new IllegalStateException("Solo préstamos en estado SOLICITADO pueden ser aprobados");
        }
        this.estado = PrestamoEstado.APROBADO;
        this.aprobadoPor = adminUserId;
        this.aprobadoAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public void rechazar() {
        if (this.estado != PrestamoEstado.SOLICITADO) {
            throw new IllegalStateException("Solo préstamos en estado SOLICITADO pueden ser rechazados");
        }
        this.estado = PrestamoEstado.RECHAZADO;
        this.updatedAt = Instant.now();
    }

    public void desembolsar(LocalDate fechaDesembolsoReal) {
        if (this.estado != PrestamoEstado.APROBADO && this.estado != PrestamoEstado.SOLICITADO) {
            throw new IllegalStateException("El préstamo debe estar APROBADO o SOLICITADO para desembolsar");
        }
        this.estado = PrestamoEstado.VIGENTE;
        if (fechaDesembolsoReal != null) {
            this.fechaDesembolso = fechaDesembolsoReal;
        }
        this.updatedAt = Instant.now();
    }

    public void verificarCancelacionTotal() {
        if (this.estado != PrestamoEstado.VIGENTE) {
            return;
        }
        boolean todasPagadas = !cuotas.isEmpty() && cuotas.stream().allMatch(c -> c.getEstado() == CuotaEstado.PAGADA);
        if (todasPagadas) {
            this.estado = PrestamoEstado.CANCELADO;
            this.updatedAt = Instant.now();
        }
    }

    public void verificarEstadoCancelacion() {
        verificarEstadoCancelacion(null);
    }

    public void verificarEstadoCancelacion(List<CuotaPrestamo> listaCuotas) {
        List<CuotaPrestamo> lista = (listaCuotas != null && !listaCuotas.isEmpty()) ? listaCuotas : this.cuotas;
        boolean todasPagadas = !lista.isEmpty() && lista.stream().allMatch(c -> c.getEstado() == CuotaEstado.PAGADA);
        if (todasPagadas) {
            this.estado = PrestamoEstado.CANCELADO;
        } else if (this.estado == PrestamoEstado.CANCELADO) {
            this.estado = PrestamoEstado.VIGENTE;
        }
        this.updatedAt = Instant.now();
    }

    public void agregarCuota(CuotaPrestamo cuota) {
        this.cuotas.add(cuota);
        cuota.asignarPrestamo(this);
    }

    public void actualizarCondiciones(
            BigDecimal montoPrincipal,
            BigDecimal tasaMensual,
            Short nroCuotas,
            LocalDate fechaDesembolso,
            LocalDate fechaPrimeraCuota,
            String proposito
    ) {
        if (montoPrincipal != null) this.montoPrincipal = montoPrincipal;
        if (tasaMensual != null) this.tasaMensual = tasaMensual;
        if (nroCuotas != null) this.nroCuotas = nroCuotas;
        if (fechaDesembolso != null) this.fechaDesembolso = fechaDesembolso;
        if (fechaPrimeraCuota != null) this.fechaPrimeraCuota = fechaPrimeraCuota;
        if (proposito != null) this.proposito = proposito;
        this.updatedAt = Instant.now();
    }

    public void anular(String motivo) {
        this.estado = PrestamoEstado.RECHAZADO;
        this.proposito = (this.proposito != null ? this.proposito + " | " : "") + "[ANULADO: " + (motivo != null ? motivo.trim() : "") + "]";
        this.updatedAt = Instant.now();
    }

    // Getters y Setters
    public UUID getId() { return id; }
    public UUID getCajaId() { return cajaId; }
    public UUID getSocioId() { return socioId; }
    public Integer getNumero() { return numero; }
    public BigDecimal getMontoPrincipal() { return montoPrincipal; }
    public BigDecimal getTasaMensual() { return tasaMensual; }
    public Short getNroCuotas() { return nroCuotas; }
    public String getMetodoAmortizacion() { return metodoAmortizacion; }
    public LocalDate getFechaDesembolso() { return fechaDesembolso; }
    public LocalDate getFechaPrimeraCuota() { return fechaPrimeraCuota; }
    public PrestamoEstado getEstado() { return estado; }
    public String getProposito() { return proposito; }
    public UUID getAprobadoPor() { return aprobadoPor; }
    public Instant getAprobadoAt() { return aprobadoAt; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public UUID getCreatedBy() { return createdBy; }
    public List<CuotaPrestamo> getCuotas() { return cuotas; }

    public void setFechaDesembolso(LocalDate fechaDesembolso) { this.fechaDesembolso = fechaDesembolso; }
    public void setFechaPrimeraCuota(LocalDate fechaPrimeraCuota) { this.fechaPrimeraCuota = fechaPrimeraCuota; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
