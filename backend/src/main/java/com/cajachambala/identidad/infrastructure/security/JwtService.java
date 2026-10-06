package com.cajachambala.identidad.infrastructure.security;

import com.cajachambala.identidad.domain.AppUser;
import com.cajachambala.identidad.domain.UserRole;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

@Service
public class JwtService {

    private final SecretKey key;
    private final long accessTokenExpirationSeconds;
    private final long mfaTokenExpirationSeconds = 300; // 5 minutos para resolver MFA

    public JwtService(
            @Value("${security.jwt.secret:${JWT_SECRET:dev_very_secure_secret_key_minimum_256_bits_length_1234567890}}") String secret,
            @Value("${security.jwt.access-token-expiration-seconds:900}") long accessTokenExpirationSeconds
    ) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessTokenExpirationSeconds = accessTokenExpirationSeconds;
    }

    public String generateAccessToken(AppUser user) {
        Instant now = Instant.now();
        Instant expiry = now.plusSeconds(accessTokenExpirationSeconds);

        var builder = Jwts.builder()
                .subject(user.getId().toString())
                .claim("role", user.getRole().name())
                .claim("caja", user.getCajaId().toString())
                .claim("ver", user.getTokenVersion())
                .claim("email", user.getEmail())
                .claim("type", "ACCESS")
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry))
                .signWith(key);

        if (user.getSocioId() != null) {
            builder.claim("socio_id", user.getSocioId().toString());
        }

        return builder.compact();
    }

    public String generateMfaToken(AppUser user) {
        Instant now = Instant.now();
        Instant expiry = now.plusSeconds(mfaTokenExpirationSeconds);

        return Jwts.builder()
                .subject(user.getId().toString())
                .claim("role", user.getRole().name())
                .claim("caja", user.getCajaId().toString())
                .claim("ver", user.getTokenVersion())
                .claim("type", "MFA_PENDING")
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry))
                .signWith(key)
                .compact();
    }

    public Claims extractClaims(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (JwtException | IllegalArgumentException e) {
            return null;
        }
    }

    public boolean isAccessTokenValid(Claims claims, AppUser user) {
        if (claims == null || user == null) {
            return false;
        }
        String type = claims.get("type", String.class);
        if (!"ACCESS".equals(type)) {
            return false;
        }
        Integer version = claims.get("ver", Integer.class);
        if (version == null || version != user.getTokenVersion()) {
            return false;
        }
        return user.getId().toString().equals(claims.getSubject());
    }

    public boolean isMfaTokenValid(Claims claims, AppUser user) {
        if (claims == null || user == null) {
            return false;
        }
        String type = claims.get("type", String.class);
        if (!"MFA_PENDING".equals(type)) {
            return false;
        }
        Integer version = claims.get("ver", Integer.class);
        return version != null && version == user.getTokenVersion() && user.getId().toString().equals(claims.getSubject());
    }
}
