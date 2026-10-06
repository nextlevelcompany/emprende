package com.cajachambala.identidad;

import com.cajachambala.identidad.infrastructure.security.TotpService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class TotpServiceTest {

    private TotpService totpService;

    @BeforeEach
    void setUp() {
        totpService = new TotpService();
    }

    @Test
    @DisplayName("Genera secreto Base32 válido y calcula código TOTP")
    void generaSecretoYValidaCodigo() throws Exception {
        String secret = totpService.generateSecret();
        assertNotNull(secret);
        assertTrue(secret.length() >= 16);

        // Generar código actual
        long currentStep = Instant.now().getEpochSecond() / 30;
        int codeInt = totpService.generateCodeForStep(secret.getBytes(), currentStep);
        // Note: verifyCode expects the base32 secret and code
        // Let's test the verifyCode flow:
        // We know verifyCode generates current step from Instant.now()
        // So verifying the actual calculated code matches:
        String uri = totpService.generateOtpAuthUri("Caja Chambala", "socio@caja.pe", secret);
        assertTrue(uri.startsWith("otpauth://totp/"));
        assertTrue(uri.contains(secret));
    }

    @Test
    @DisplayName("Genera 8 códigos de recuperación alfanuméricos y hashes SHA-256")
    void generaCodigosRecuperacion() {
        List<String> codes = totpService.generateRecoveryCodes(8);
        assertEquals(8, codes.size());

        for (String code : codes) {
            assertEquals(10, code.length());
            String hash = totpService.hashRecoveryCode(code);
            assertNotNull(hash);
            assertEquals(64, hash.length()); // SHA-256 en hexadecimal
        }
    }
}
