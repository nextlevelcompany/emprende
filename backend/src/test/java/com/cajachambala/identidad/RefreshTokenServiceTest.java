package com.cajachambala.identidad;

import com.cajachambala.identidad.domain.AppUser;
import com.cajachambala.identidad.domain.RefreshToken;
import com.cajachambala.identidad.domain.UserRole;
import com.cajachambala.identidad.infrastructure.persistence.AppUserRepository;
import com.cajachambala.identidad.infrastructure.persistence.RefreshTokenRepository;
import com.cajachambala.identidad.infrastructure.security.RefreshTokenService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.security.authentication.BadCredentialsException;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class RefreshTokenServiceTest {

    private RefreshTokenRepository refreshTokenRepository;
    private AppUserRepository appUserRepository;
    private RefreshTokenService refreshTokenService;
    private AppUser user;

    @BeforeEach
    void setUp() {
        refreshTokenRepository = mock(RefreshTokenRepository.class);
        appUserRepository = mock(AppUserRepository.class);
        refreshTokenService = new RefreshTokenService(refreshTokenRepository, appUserRepository, 604800);

        user = AppUser.create(
                UUID.randomUUID(),
                "socio@cajachambala.pe",
                "$argon2id$hash",
                UserRole.SOCIO,
                UUID.randomUUID(),
                false
        );
    }

    @Test
    @DisplayName("Crea Refresh Token nuevo y persiste su hash SHA-256")
    void creaRefreshToken() {
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(i -> i.getArgument(0));

        RefreshTokenService.TokenPair pair = refreshTokenService.createRefreshToken(user.getId(), null, "127.0.0.1", "Mozilla/5.0");

        assertNotNull(pair.rawRefreshToken());
        assertEquals(64, pair.rawRefreshToken().length());
        assertEquals(refreshTokenService.hashToken(pair.rawRefreshToken()), pair.entity().getTokenHash());
        verify(refreshTokenRepository).save(any(RefreshToken.class));
    }

    @Test
    @DisplayName("Rota token activo manteniendo la misma familia y revocando el token previo")
    void rotaTokenActivo() {
        String rawToken = "a".repeat(64);
        String hash = refreshTokenService.hashToken(rawToken);
        UUID familyId = UUID.randomUUID();

        RefreshToken existing = RefreshToken.create(
                user.getId(),
                familyId,
                hash,
                Instant.now().plusSeconds(3600),
                "127.0.0.1",
                "Chrome"
        );

        when(refreshTokenRepository.findByTokenHash(hash)).thenReturn(Optional.of(existing));
        when(appUserRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(i -> i.getArgument(0));

        RefreshTokenService.RotationResult result = refreshTokenService.rotate(rawToken, "127.0.0.1", "Chrome");

        assertNotNull(result.newRawRefreshToken());
        assertNotEquals(rawToken, result.newRawRefreshToken());
        assertEquals(user, result.user());
        assertNotNull(existing.getRevokedAt());
    }

    @Test
    @DisplayName("Detecta intento de reutilización de token revocado y revoca toda la familia")
    void detectaReusoYRevocaFamilia() {
        String rawToken = "b".repeat(64);
        String hash = refreshTokenService.hashToken(rawToken);
        UUID familyId = UUID.randomUUID();

        RefreshToken revoked = RefreshToken.create(
                user.getId(),
                familyId,
                hash,
                Instant.now().plusSeconds(3600),
                "127.0.0.1",
                "Chrome"
        );
        revoked.revoke(UUID.randomUUID()); // Ya revocado anteriormente

        when(refreshTokenRepository.findByTokenHash(hash)).thenReturn(Optional.of(revoked));

        BadCredentialsException exception = assertThrows(BadCredentialsException.class, () ->
                refreshTokenService.rotate(rawToken, "127.0.0.1", "Chrome")
        );

        assertTrue(exception.getMessage().contains("reutilización"));
        verify(refreshTokenRepository).revokeFamily(familyId);
    }
}
