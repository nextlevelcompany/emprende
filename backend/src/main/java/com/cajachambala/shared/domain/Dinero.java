package com.cajachambala.shared.domain;

import java.io.Serializable;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Objects;

/**
 * Objeto de valor inmutable para el manejo de importes monetarios en Soles (PEN S/.).
 * Aplica de forma estricta una escala de 2 decimales y redondeo RoundingMode.HALF_UP.
 */
public final class Dinero implements Comparable<Dinero>, Serializable {

    private static final int ESCALA = 2;
    private static final RoundingMode MODO_REDONDEO = RoundingMode.HALF_UP;

    public static final Dinero CERO = new Dinero(BigDecimal.ZERO);

    private final BigDecimal monto;

    private Dinero(BigDecimal monto) {
        if (monto == null) {
            throw new IllegalArgumentException("El monto no puede ser nulo");
        }
        this.monto = monto.setScale(ESCALA, MODO_REDONDEO);
    }

    public static Dinero de(BigDecimal monto) {
        return new Dinero(monto);
    }

    public static Dinero de(double monto) {
        return new Dinero(BigDecimal.valueOf(monto));
    }

    public static Dinero de(long monto) {
        return new Dinero(BigDecimal.valueOf(monto));
    }

    public static Dinero cero() {
        return CERO;
    }

    public BigDecimal getMonto() {
        return monto;
    }

    public Dinero sumar(Dinero otro) {
        Objects.requireNonNull(otro, "El sumando no puede ser nulo");
        return new Dinero(this.monto.add(otro.monto));
    }

    public Dinero restar(Dinero otro) {
        Objects.requireNonNull(otro, "El sustraendo no puede ser nulo");
        return new Dinero(this.monto.subtract(otro.monto));
    }

    public Dinero multiplicar(BigDecimal factor) {
        Objects.requireNonNull(factor, "El factor de multiplicación no puede ser nulo");
        return new Dinero(this.monto.multiply(factor));
    }

    public Dinero multiplicar(double factor) {
        return multiplicar(BigDecimal.valueOf(factor));
    }

    public Dinero dividir(int divisor) {
        if (divisor == 0) {
            throw new ArithmeticException("División por cero en cálculo de Dinero");
        }
        return new Dinero(this.monto.divide(BigDecimal.valueOf(divisor), ESCALA, MODO_REDONDEO));
    }

    public boolean esCero() {
        return this.monto.compareTo(BigDecimal.ZERO) == 0;
    }

    public boolean esPositivo() {
        return this.monto.compareTo(BigDecimal.ZERO) > 0;
    }

    public boolean esNegativo() {
        return this.monto.compareTo(BigDecimal.ZERO) < 0;
    }

    public boolean esMayorQue(Dinero otro) {
        return this.compareTo(otro) > 0;
    }

    public boolean esMenorQue(Dinero otro) {
        return this.compareTo(otro) < 0;
    }

    @Override
    public int compareTo(Dinero otro) {
        Objects.requireNonNull(otro, "No se puede comparar con un Dinero nulo");
        return this.monto.compareTo(otro.monto);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Dinero dinero = (Dinero) o;
        return monto.compareTo(dinero.monto) == 0;
    }

    @Override
    public int hashCode() {
        return Objects.hash(monto.stripTrailingZeros());
    }

    @Override
    public String toString() {
        return "S/ " + monto.toPlainString();
    }
}
