package com.cajachambala.identidad.infrastructure.security;

import com.cajachambala.identidad.domain.AppUser;
import com.cajachambala.identidad.domain.RefreshToken;
import com.cajachambala.identidad.infrastructure.persistence.AppUserRepository;
import com.cajachambala.identidad.infrastructure.persistence.RefreshTokenRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.HexFormat;
import java.util.UUID;

@Service
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final AppUserRepository appUserRepository;
    private final long refreshTokenExpirationSeconds;
    private final SecureRandom secureRandom = new SecureRandom();

    public RefreshTokenService(
            RefreshTokenRepository refreshTokenRepository,
            AppUserRepository appUserRepository,
            @Value("${security.jwt.refresh-token-expiration-seconds:604800}") long refreshTokenExpirationSeconds // 7 días
    ) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.appUserRepository = appUserRepository;
        this.refreshTokenExpirationSeconds = refreshTokenExpirationSeconds;
    }

    public record TokenPair(String rawRefreshToken, RefreshToken entity) {}
    public record RotationResult(String newRawRefreshToken, AppUser user) {}

    @Transactional
    public TokenPair createRefreshToken(UUID userId, UUID familyId, String ip, String userAgent) {
        String rawToken = generateSecureRandomHex(32);
        String tokenHash = hashToken(rawToken);
        Instant expiresAt = Instant.now().plusSeconds(refreshTokenExpirationSeconds);

        RefreshToken entity = RefreshToken.create(userId, familyId, tokenHash, expiresAt, ip, userAgent);
        RefreshToken saved = refreshTokenRepository.save(entity);
        return new TokenPair(rawToken, saved);
    }

    @Transactional
    public RotationResult rotate(String rawRefreshToken, String ip, String userAgent) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            throw new BadCredentialsException("Token de actualización ausente");
        }

        String tokenHash = hashToken(rawRefreshToken.trim());
        RefreshToken existing = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new BadCredentialsException("Token de actualización no reconocido"));

        // Detección de reuso de token comprometido
        if (existing.getRevokedAt() != null) {
            refreshTokenRepository.revokeFamily(existing.getFamilyId());
            throw new BadCredentialsException("Alerta de seguridad: intento de reutilización de token. La familia de sesiones ha sido revocada.");
        }

        if (!existing.isActive()) {
            throw new BadCredentialsException("Token de actualización expirado");
        }

        AppUser user = appUserRepository.findById(existing.getUserId())
                .orElseThrow(() -> new BadCredentialsException("Usuario no encontrado"));

        if (user.isAccountLocked()) {
            throw new BadCredentialsException("La cuenta del usuario se encuentra bloqueada");
        }

        // Crear nuevo token en la misma familia
        String newRawToken = generateSecureRandomHex(32);
        String newTokenHash = hashToken(newRawToken);
        Instant expiresAt = Instant.now().plusSeconds(refreshTokenExpirationSeconds);

        RefreshToken nextToken = RefreshToken.create(
                user.getId(),
                existing.getFamilyId(),
                newTokenHash,
                expiresAt,
                ip,
                userAgent
        );
        refreshTokenRepository.save(nextToken);

        // Revocar el token anterior y apuntar al nuevo
        existing.revoke(nextToken.getId());
        refreshTokenRepository.save(existing);

        return new RotationResult(newRawToken, user);
    }

    @Transactional
    public void revokeToken(String rawRefreshToken) {
        if (rawRefreshToken != null && !rawRefreshToken.isBlank()) {
            String tokenHash = hashToken(rawRefreshToken.trim());
            refreshTokenRepository.findByTokenHash(tokenHash).ifPresent(token -> {
                token.revoke(null);
                refreshTokenRepository.save(token);
            });
        }
    }

    public String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new IllegalStateException("Error al generar hash SHA-256", e);
        }
    }

    private String generateSecureRandomHex(int byteCount) {
        byte[] bytes = new byte[byteCount];
        secureRandom.nextBytes(bytes);
        return HexFormat.of().formatHex(bytes);
    }
}
