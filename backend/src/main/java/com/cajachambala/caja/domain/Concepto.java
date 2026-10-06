package com.cajachambala.caja.domain;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcType;
import org.hibernate.dialect.PostgreSQLEnumJdbcType;

@Entity
@Table(name = "concepto")
public class Concepto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Short id;

    @Column(nullable = false, unique = true, length = 40)
    private String codigo;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Enumerated(EnumType.STRING)
    @JdbcType(PostgreSQLEnumJdbcType.class)
    @Column(nullable = false)
    private FlujoTipo tipo;

    @Column(name = "requiere_socio", nullable = false)
    private boolean requiereSocio;

    @Column(nullable = false)
    private Short orden;

    @Column(nullable = false)
    private boolean activo;

    protected Concepto() {
    }

    public Concepto(Short id, String codigo, String nombre, FlujoTipo tipo, boolean requiereSocio, Short orden) {
        this.id = id;
        this.codigo = codigo;
        this.nombre = nombre;
        this.tipo = tipo;
        this.requiereSocio = requiereSocio;
        this.orden = orden;
        this.activo = true;
    }

    public Concepto(String codigo, String nombre, FlujoTipo tipo, boolean requiereSocio, Short orden) {
        this(null, codigo, nombre, tipo, requiereSocio, orden);
    }

    public Short getId() { return id; }
    public String getCodigo() { return codigo; }
    public String getNombre() { return nombre; }
    public FlujoTipo getTipo() { return tipo; }
    public boolean isRequiereSocio() { return requiereSocio; }
    public Short getOrden() { return orden; }
    public boolean isActivo() { return activo; }
}
