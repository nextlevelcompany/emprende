package com.cajachambala.caja.domain;

import com.cajachambala.shared.domain.IdGenerator;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcType;
import org.hibernate.dialect.PostgreSQLEnumJdbcType;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "operacion_detalle")
public class OperacionDetalle {

    @Id
    private UUID id;

    @Column(name = "operacion_id", nullable = false)
    private UUID operacionId;

    @Enumerated(EnumType.STRING)
    @JdbcType(PostgreSQLEnumJdbcType.class)
    @Column(nullable = false)
    private FlujoTipo tipo;

    @Column(name = "concepto_id", nullable = false)
    private Short conceptoId;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal monto;

    @Column(name = "prestamo_id")
    private UUID prestamoId;

    @Column(name = "cuota_id")
    private UUID cuotaId;

    protected OperacionDetalle() {
    }

    public OperacionDetalle(UUID operacionId, FlujoTipo tipo, Short conceptoId, BigDecimal monto) {
        this.id = IdGenerator.nextId();
        this.operacionId = operacionId;
        this.tipo = tipo;
        this.conceptoId = conceptoId;
        this.monto = monto;
    }

    public OperacionDetalle(UUID operacionId, FlujoTipo tipo, Short conceptoId, BigDecimal monto, UUID prestamoId, UUID cuotaId) {
        this(operacionId, tipo, conceptoId, monto);
        this.prestamoId = prestamoId;
        this.cuotaId = cuotaId;
    }

    public UUID getId() { return id; }
    public UUID getOperacionId() { return operacionId; }
    public FlujoTipo getTipo() { return tipo; }
    public Short getConceptoId() { return conceptoId; }
    public BigDecimal getMonto() { return monto; }
    public UUID getPrestamoId() { return prestamoId; }
    public UUID getCuotaId() { return cuotaId; }

    public void setMonto(BigDecimal monto) {
        this.monto = monto;
    }
}
