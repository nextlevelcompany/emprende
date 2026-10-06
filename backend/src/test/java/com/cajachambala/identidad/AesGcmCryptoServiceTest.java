package com.cajachambala.identidad;

import com.cajachambala.identidad.infrastructure.security.AesGcmCryptoService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class AesGcmCryptoServiceTest {

    private final AesGcmCryptoService cryptoService = new AesGcmCryptoService("test_secret_key_minimum_256_bits_length_1234567890");

    @Test
    @DisplayName("Cifra y descifra cadenas con AES-256-GCM correctamente")
    void cifraYDescifraTexto() {
        String textoOriginal = "JBSWY3DPEHPK3PXP"; // Secreto TOTP Base32 de prueba

        byte[] cifrado = cryptoService.encryptString(textoOriginal);
        assertNotNull(cifrado);
        assertNotEquals(0, cifrado.length);

        String descifrado = cryptoService.decryptString(cifrado);
        assertEquals(textoOriginal, descifrado);
    }

    @Test
    @DisplayName("Falla al intentar descifrar datos adulterados (integridad GCM)")
    void fallaConDatosAlterados() {
        String texto = "DNI_CONFIDENCIAL_12345678";
        byte[] cifrado = cryptoService.encryptString(texto);

        // Alterar el último byte (tag de autenticación)
        cifrado[cifrado.length - 1] ^= (byte) 0xFF;

        assertThrows(IllegalStateException.class, () -> cryptoService.decryptString(cifrado));
    }
}
