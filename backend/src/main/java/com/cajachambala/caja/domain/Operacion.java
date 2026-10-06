package com.cajachambala.caja.domain;

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
@Table(name = "operacion")
public class Operacion {

    @Id
    private UUID id;

    @Column(name = "caja_id", nullable = false)
    private UUID cajaId;

    @Column(name = "periodo_id", nullable = false)
    private UUID periodoId;

    @Column(name = "socio_id")
    private UUID socioId;

    @Enumerated(EnumType.STRING)
    @JdbcType(PostgreSQLEnumJdbcType.class)
    @Column(nullable = false)
    private FlujoTipo tipo;

    @Column(nullable = false)
    private LocalDate fecha;

    @Column(name = "nro_recibo")
    private Integer nroRecibo;

    @Column(length = 255)
    private String descripcion;

    @Enumerated(EnumType.STRING)
    @JdbcType(PostgreSQLEnumJdbcType.class)
    @Column(nullable = false)
    private OperacionEstado estado;

    @Column(name = "anulado_at")
    private Instant anuladoAt;

    @Column(name = "anulado_por")
    private UUID anuladoPor;

    @Column(name = "motivo_anulacion", columnDefinition = "text")
    private String motivoAnulacion;

    @Column(name = "import_batch_id")
    private UUID importBatchId;

    @Column(name = "origen_ref", length = 80)
    private String origenRef;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JoinColumn(name = "operacion_id")
    private List<OperacionDetalle> detalles = new ArrayList<>();

    protected Operacion() {
    }

    public Operacion(
            UUID cajaId,
            UUID periodoId,
            UUID socioId,
            FlujoTipo tipo,
            LocalDate fecha,
            Integer nroRecibo,
            String descripcion,
            UUID createdBy
    ) {
        this.id = IdGenerator.nextId();
        this.cajaId = cajaId;
        this.periodoId = periodoId;
        this.socioId = socioId;
        this.tipo = tipo;
        this.fecha = (fecha != null) ? fecha : LocalDate.now();
        this.nroRecibo = nroRecibo;
        this.descripcion = descripcion;
        this.estado = OperacionEstado.VIGENTE;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
        this.createdBy = createdBy;
    }

    public void agregarDetalle(Short conceptoId, BigDecimal monto) {
        if (monto == null || monto.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }
        this.detalles.add(new OperacionDetalle(this.id, this.tipo, conceptoId, monto));
    }

    public void agregarDetalle(Short conceptoId, BigDecimal monto, UUID prestamoId, UUID cuotaId) {
        if (monto == null || monto.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }
        this.detalles.add(new OperacionDetalle(this.id, this.tipo, conceptoId, monto, prestamoId, cuotaId));
    }

    public void anular(UUID userId, String motivo) {
        if (this.estado == OperacionEstado.ANULADA) {
            throw new IllegalStateException("La operación ya se encuentra anulada");
        }
        if (motivo == null || motivo.isBlank()) {
            throw new IllegalArgumentException("El motivo de anulación es requerido");
        }
        this.estado = OperacionEstado.ANULADA;
        this.anuladoAt = Instant.now();
        this.anuladoPor = userId;
        this.motivoAnulacion = motivo.trim();
        this.updatedAt = Instant.now();
    }

    public BigDecimal getTotal() {
        return detalles.stream()
                .map(OperacionDetalle::getMonto)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public UUID getId() { return id; }
    public UUID getCajaId() { return cajaId; }
    public UUID getPeriodoId() { return periodoId; }
    public UUID getSocioId() { return socioId; }
    public FlujoTipo getTipo() { return tipo; }
    public LocalDate getFecha() { return fecha; }
    public Integer getNroRecibo() { return nroRecibo; }
    public String getDescripcion() { return descripcion; }
    public OperacionEstado getEstado() { return estado; }
    public Instant getAnuladoAt() { return anuladoAt; }
    public UUID getAnuladoPor() { return anuladoPor; }
    public String getMotivoAnulacion() { return motivoAnulacion; }
    public UUID getImportBatchId() { return importBatchId; }
    public String getOrigenRef() { return origenRef; }
    public Instant getCreatedAt() { return createdAt; }
    public UUID getCreatedBy() { return createdBy; }
    public Instant getUpdatedAt() { return updatedAt; }
    public List<OperacionDetalle> getDetalles() { return detalles; }
}
