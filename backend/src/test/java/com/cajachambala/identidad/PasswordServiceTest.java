package com.cajachambala.identidad;

import com.cajachambala.identidad.infrastructure.security.PasswordService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.argon2.Argon2PasswordEncoder;

import static org.junit.jupiter.api.Assertions.*;

class PasswordServiceTest {

    private PasswordService passwordService;

    @BeforeEach
    void setUp() {
        // En tests usamos parámetros reducidos para agilidad (memory 4096, 1 iteración)
        var encoder = new Argon2PasswordEncoder(16, 32, 1, 4096, 1);
        passwordService = new PasswordService(encoder);
    }

    @Test
    @DisplayName("Rechaza contraseñas con menos de 12 caracteres (OWASP ASVS)")
    void rechazaContrasenaCorta() {
        assertThrows(IllegalArgumentException.class, () ->
                passwordService.validatePasswordStrength("Corto123#", "usuario@caja.pe")
        );
    }

    @Test
    @DisplayName("Rechaza contraseñas comunes predecibles")
    void rechazaContrasenaComun() {
        assertThrows(IllegalArgumentException.class, () ->
                passwordService.validatePasswordStrength("password12345", "usuario@caja.pe")
        );
    }

    @Test
    @DisplayName("Rechaza contraseñas que contienen el identificador del correo")
    void rechazaContrasenaConEmail() {
        assertThrows(IllegalArgumentException.class, () ->
                passwordService.validatePasswordStrength("Carlos12345#Seguro", "carlos@caja.pe")
        );
    }

    @Test
    @DisplayName("Acepta contraseña robusta válida")
    void aceptaContrasenaRobusta() {
        assertDoesNotThrow(() ->
                passwordService.validatePasswordStrength("MiClaveMuySegura2026#$", "usuario@caja.pe")
        );
    }

    @Test
    @DisplayName("Hashea y valida correctamente con Argon2id")
    void hasheaYVerificaArgon2id() {
        String raw = "MiClaveSuperSecreta2026!";
        String hash = passwordService.encode(raw);

        assertTrue(hash.startsWith("$argon2id$"));
        assertTrue(passwordService.matches(raw, hash));
        assertFalse(passwordService.matches("ClaveErronea123!", hash));
    }
}
