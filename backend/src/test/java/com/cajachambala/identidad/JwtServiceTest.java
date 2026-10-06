package com.cajachambala.identidad;

import com.cajachambala.identidad.domain.AppUser;
import com.cajachambala.identidad.domain.UserRole;
import com.cajachambala.identidad.infrastructure.security.JwtService;
import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    private JwtService jwtService;
    private AppUser user;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService("secret_muy_seguro_con_mas_de_256_bits_para_pruebas_unitarias_123456", 900);
        user = AppUser.create(
                UUID.randomUUID(),
                "admin@cajachambala.pe",
                "$argon2id$test",
                UserRole.ADMIN,
                null,
                false
        );
    }

    @Test
    @DisplayName("Genera y valida Access Token JWT con claims requeridos")
    void generaYValidaAccessToken() {
        String token = jwtService.generateAccessToken(user);
        assertNotNull(token);

        Claims claims = jwtService.extractClaims(token);
        assertNotNull(claims);
        assertEquals(user.getId().toString(), claims.getSubject());
        assertEquals("ADMIN", claims.get("role", String.class));
        assertEquals(user.getCajaId().toString(), claims.get("caja", String.class));
        assertEquals("ACCESS", claims.get("type", String.class));

        assertTrue(jwtService.isAccessTokenValid(claims, user));
    }

    @Test
    @DisplayName("Invalida token si la versión del usuario cambia (cierre global de sesión)")
    void invalidaTokenPorVersion() {
        String token = jwtService.generateAccessToken(user);
        Claims claims = jwtService.extractClaims(token);

        // Simular cambio de contraseña / incremento de versión
        user.changePassword("$argon2id$newPasswordHash");

        assertFalse(jwtService.isAccessTokenValid(claims, user));
    }

    @Test
    @DisplayName("Genera token temporal para MFA pendiente y no se acepta como access token")
    void generaTokenMfaPendiente() {
        String mfaToken = jwtService.generateMfaToken(user);
        Claims claims = jwtService.extractClaims(mfaToken);

        assertNotNull(claims);
        assertEquals("MFA_PENDING", claims.get("type", String.class));
        assertTrue(jwtService.isMfaTokenValid(claims, user));
        assertFalse(jwtService.isAccessTokenValid(claims, user));
    }
}
