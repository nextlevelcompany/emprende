package com.cajachambala.directiva.domain;

import com.cajachambala.socios.domain.Socio;
import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "junta_directiva")
public class DirectivaCargo {

    @Id
    private UUID id;

    @Column(name = "caja_id", nullable = false)
    private UUID cajaId;

    @Column(nullable = false, length = 50)
    private String cargo;

    @Column(name = "cargo_titulo", nullable = false, length = 100)
    private String cargoTitulo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "socio_id")
    private Socio socio;

    @Column(name = "nombre_completo", nullable = false, length = 200)
    private String nombreCompleto;

    @Column(name = "tipo_documento", length = 20)
    private String tipoDocumento;

    @Column(name = "numero_documento", length = 20)
    private String numeroDocumento;

    @Column(length = 30)
    private String telefono;

    @Column(length = 100)
    private String email;

    @Column(name = "periodo_inicio")
    private LocalDate periodoInicio;

    @Column(name = "periodo_fin")
    private LocalDate periodoFin;

    @Column(nullable = false)
    private boolean activo = true;

    @Column(nullable = false)
    private short orden = 1;

    @Column(columnDefinition = "text")
    private String observaciones;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @Column(name = "created_by")
    private UUID createdBy;

    public DirectivaCargo() {}

    public DirectivaCargo(
            UUID id,
            UUID cajaId,
            String cargo,
            String cargoTitulo,
            Socio socio,
            String nombreCompleto,
            String tipoDocumento,
            String numeroDocumento,
            String telefono,
            String email,
            LocalDate periodoInicio,
            LocalDate periodoFin,
            boolean activo,
            short orden,
            String observaciones,
            UUID createdBy
    ) {
        this.id = id != null ? id : UUID.randomUUID();
        this.cajaId = cajaId;
        this.cargo = cargo;
        this.cargoTitulo = cargoTitulo;
        this.socio = socio;
        this.nombreCompleto = nombreCompleto;
        this.tipoDocumento = tipoDocumento != null ? tipoDocumento : "DNI";
        this.numeroDocumento = numeroDocumento;
        this.telefono = telefono;
        this.email = email;
        this.periodoInicio = periodoInicio;
        this.periodoFin = periodoFin;
        this.activo = activo;
        this.orden = orden;
        this.observaciones = observaciones;
        this.createdBy = createdBy;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public void actualizar(
            String cargo,
            String cargoTitulo,
            Socio socio,
            String nombreCompleto,
            String tipoDocumento,
            String numeroDocumento,
            String telefono,
            String email,
            LocalDate periodoInicio,
            LocalDate periodoFin,
            boolean activo,
            short orden,
            String observaciones
    ) {
        this.cargo = cargo;
        this.cargoTitulo = cargoTitulo;
        this.socio = socio;
        this.nombreCompleto = nombreCompleto;
        this.tipoDocumento = tipoDocumento != null ? tipoDocumento : "DNI";
        this.numeroDocumento = numeroDocumento;
        this.telefono = telefono;
        this.email = email;
        this.periodoInicio = periodoInicio;
        this.periodoFin = periodoFin;
        this.activo = activo;
        this.orden = orden;
        this.observaciones = observaciones;
        this.updatedAt = Instant.now();
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getCajaId() { return cajaId; }
    public void setCajaId(UUID cajaId) { this.cajaId = cajaId; }

    public String getCargo() { return cargo; }
    public void setCargo(String cargo) { this.cargo = cargo; }

    public String getCargoTitulo() { return cargoTitulo; }
    public void setCargoTitulo(String cargoTitulo) { this.cargoTitulo = cargoTitulo; }

    public Socio getSocio() { return socio; }
    public void setSocio(Socio socio) { this.socio = socio; }

    public String getNombreCompleto() { return nombreCompleto; }
    public void setNombreCompleto(String nombreCompleto) { this.nombreCompleto = nombreCompleto; }

    public String getTipoDocumento() { return tipoDocumento; }
    public void setTipoDocumento(String tipoDocumento) { this.tipoDocumento = tipoDocumento; }

    public String getNumeroDocumento() { return numeroDocumento; }
    public void setNumeroDocumento(String numeroDocumento) { this.numeroDocumento = numeroDocumento; }

    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public LocalDate getPeriodoInicio() { return periodoInicio; }
    public void setPeriodoInicio(LocalDate periodoInicio) { this.periodoInicio = periodoInicio; }

    public LocalDate getPeriodoFin() { return periodoFin; }
    public void setPeriodoFin(LocalDate periodoFin) { this.periodoFin = periodoFin; }

    public boolean isActivo() { return activo; }
    public void setActivo(boolean activo) { this.activo = activo; }

    public short getOrden() { return orden; }
    public void setOrden(short orden) { this.orden = orden; }

    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }

    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public UUID getCreatedBy() { return createdBy; }
    public void setCreatedBy(UUID createdBy) { this.createdBy = createdBy; }
}
