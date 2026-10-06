package com.cajachambala.shared.domain;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Pruebas Unitarias - Objeto de Valor Dinero")
class DineroTest {

    @Test
    @DisplayName("Debe instanciar correctamente con escala a 2 decimales y redondeo HALF_UP")
    void debeInstanciarConEscalaCorrecta() {
        Dinero d1 = Dinero.de(100.555);
        assertEquals(new BigDecimal("100.56"), d1.getMonto());

        Dinero d2 = Dinero.de(100.554);
        assertEquals(new BigDecimal("100.55"), d2.getMonto());
    }

    @Test
    @DisplayName("Debe sumar correctamente dos importes de Dinero")
    void debeSumarCorrectamente() {
        Dinero d1 = Dinero.de(150.50);
        Dinero d2 = Dinero.de(49.50);
        Dinero suma = d1.sumar(d2);

        assertEquals(new BigDecimal("200.00"), suma.getMonto());
    }

    @Test
    @DisplayName("Debe restar correctamente dos importes de Dinero")
    void debeRestarCorrectamente() {
        Dinero d1 = Dinero.de(500.00);
        Dinero d2 = Dinero.de(120.75);
        Dinero resta = d1.restar(d2);

        assertEquals(new BigDecimal("379.25"), resta.getMonto());
    }

    @Test
    @DisplayName("Debe calcular cuota con división bancaria HALF_UP")
    void debeDividirEnCuotasCorrectamente() {
        Dinero total = Dinero.de(1000.00);
        Dinero cuota = total.dividir(3);

        // 1000 / 3 = 333.3333... -> 333.33
        assertEquals(new BigDecimal("333.33"), cuota.getMonto());
    }

    @Test
    @DisplayName("Debe multiplicar por tasa de interés correctamente")
    void debeMultiplicarPorTasa() {
        Dinero principal = Dinero.de(1000.00);
        BigDecimal tasa5PorCiento = new BigDecimal("0.05");

        Dinero interes = principal.multiplicar(tasa5PorCiento);
        assertEquals(new BigDecimal("50.00"), interes.getMonto());
    }

    @Test
    @DisplayName("Debe verificar igualdad semántica de importes independientemente de escala de origen")
    void debeVerificarIgualdad() {
        Dinero d1 = Dinero.de(new BigDecimal("50.0"));
        Dinero d2 = Dinero.de(new BigDecimal("50.0000"));

        assertEquals(d1, d2);
        assertEquals(d1.hashCode(), d2.hashCode());
    }

    @Test
    @DisplayName("Debe arrojar excepción ante división por cero o argumentos nulos")
    void debeValidarOperacionesInvalidas() {
        assertThrows(IllegalArgumentException.class, () -> Dinero.de((BigDecimal) null));
        assertThrows(NullPointerException.class, () -> Dinero.de(10).sumar(null));
        assertThrows(ArithmeticException.class, () -> Dinero.de(10).dividir(0));
    }
}
