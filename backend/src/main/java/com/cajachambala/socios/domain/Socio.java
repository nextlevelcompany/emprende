package com.cajachambala.socios.domain;

import com.cajachambala.shared.domain.IdGenerator;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcType;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.dialect.PostgreSQLEnumJdbcType;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "socio")
public class Socio {

    @Id
    private UUID id;

    @Column(name = "caja_id", nullable = false)
    private UUID cajaId;

    @Column(nullable = false)
    private Integer codigo;

    @Enumerated(EnumType.STRING)
    @JdbcType(PostgreSQLEnumJdbcType.class)
    @Column(nullable = false)
    private SocioTipo tipo;

    @Column(nullable = false, length = 100)
    private String nombres;

    @Column(nullable = false, length = 100)
    private String apellidos;

    @Column(name = "nombre_completo", insertable = false, updatable = false)
    private String nombreCompleto;

    @Column(name = "documento_tipo", nullable = false, length = 10)
    private String documentoTipo;

    @Column(name = "documento_enc")
    private byte[] documentoEnc;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "documento_hash", length = 64)
    private String documentoHash;

    @Column(length = 20)
    private String telefono;

    @Column(columnDefinition = "citext")
    private String email;

    @Column(columnDefinition = "text")
    private String direccion;

    @Column(name = "fecha_ingreso", nullable = false)
    private LocalDate fechaIngreso;

    @Column(name = "fecha_retiro")
    private LocalDate fechaRetiro;

    @Enumerated(EnumType.STRING)
    @JdbcType(PostgreSQLEnumJdbcType.class)
    @Column(nullable = false)
    private SocioEstado estado;

    @Column(columnDefinition = "text")
    private String notas;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    protected Socio() {
    }

    public Socio(
            UUID cajaId,
            Integer codigo,
            SocioTipo tipo,
            String nombres,
            String apellidos,
            String documentoTipo,
            byte[] documentoEnc,
            String documentoHash,
            String telefono,
            String email,
            String direccion,
            LocalDate fechaIngreso,
            UUID createdBy
    ) {
        this.id = IdGenerator.nextId();
        this.cajaId = cajaId;
        this.codigo = codigo;
        this.tipo = (tipo != null) ? tipo : SocioTipo.SOCIO;
        this.nombres = nombres;
        this.apellidos = apellidos;
        this.documentoTipo = (documentoTipo != null) ? documentoTipo : "DNI";
        this.documentoEnc = documentoEnc;
        this.documentoHash = documentoHash;
        this.telefono = telefono;
        this.email = email;
        this.direccion = direccion;
        this.fechaIngreso = (fechaIngreso != null) ? fechaIngreso : LocalDate.now();
        this.estado = SocioEstado.ACTIVO;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
        this.createdBy = createdBy;
    }

    public void actualizar(
            String nombres,
            String apellidos,
            String telefono,
            String email,
            String direccion,
            String notas
    ) {
        if (nombres != null && !nombres.isBlank()) this.nombres = nombres;
        if (apellidos != null && !apellidos.isBlank()) this.apellidos = apellidos;
        this.telefono = telefono;
        this.email = email;
        this.direccion = direccion;
        this.notas = notas;
        this.updatedAt = Instant.now();
    }

    public void cambiarDocumento(String documentoTipo, byte[] documentoEnc, String documentoHash) {
        this.documentoTipo = documentoTipo;
        this.documentoEnc = documentoEnc;
        this.documentoHash = documentoHash;
        this.updatedAt = Instant.now();
    }

    public void darDeBaja(LocalDate fechaRetiro, String motivo) {
        this.estado = SocioEstado.RETIRADO;
        this.fechaRetiro = (fechaRetiro != null) ? fechaRetiro : LocalDate.now();
        if (motivo != null && !motivo.isBlank()) {
            this.notas = (this.notas != null ? this.notas + "\n" : "") + "Baja: " + motivo;
        }
        this.updatedAt = Instant.now();
    }

    public void softDelete() {
        this.deletedAt = Instant.now();
        this.estado = SocioEstado.INACTIVO;
        this.updatedAt = Instant.now();
    }

    public void reactivar() {
        this.estado = SocioEstado.ACTIVO;
        this.fechaRetiro = null;
        this.deletedAt = null;
        this.updatedAt = Instant.now();
    }

    // Getters
    public UUID getId() { return id; }
    public UUID getCajaId() { return cajaId; }
    public Integer getCodigo() { return codigo; }
    public SocioTipo getTipo() { return tipo; }
    public String getNombres() { return nombres; }
    public String getApellidos() { return apellidos; }
    public String getNombreCompleto() { return (nombreCompleto != null) ? nombreCompleto : (apellidos + " " + nombres); }
    public String getDocumentoTipo() { return documentoTipo; }
    public byte[] getDocumentoEnc() { return documentoEnc; }
    public String getDocumentoHash() { return documentoHash; }
    public String getTelefono() { return telefono; }
    public String getEmail() { return email; }
    public String getDireccion() { return direccion; }
    public LocalDate getFechaIngreso() { return fechaIngreso; }
    public LocalDate getFechaRetiro() { return fechaRetiro; }
    public SocioEstado getEstado() { return estado; }
    public String getNotas() { return notas; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public UUID getCreatedBy() { return createdBy; }
    public Instant getDeletedAt() { return deletedAt; }
}
