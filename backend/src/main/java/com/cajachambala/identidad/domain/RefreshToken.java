package com.cajachambala.identidad.domain;

import com.cajachambala.shared.domain.IdGenerator;
import jakarta.persistence.*;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "refresh_token")
public class RefreshToken {

    @Id
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "family_id", nullable = false)
    private UUID familyId;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "token_hash", nullable = false, length = 64, unique = true)
    private String tokenHash;

    @Column(name = "issued_at", nullable = false)
    private Instant issuedAt;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "revoked_at")
    private Instant revokedAt;

    @Column(name = "replaced_by")
    private UUID replacedBy;

    @org.hibernate.annotations.ColumnTransformer(write = "?::inet")
    @Column(name = "ip", columnDefinition = "inet")
    private String ip;

    @Column(name = "user_agent", columnDefinition = "text")
    private String userAgent;

    protected RefreshToken() {
        // Para JPA
    }

    public static RefreshToken create(
            UUID userId,
            UUID familyId,
            String tokenHash,
            Instant expiresAt,
            String ip,
            String userAgent
    ) {
        RefreshToken token = new RefreshToken();
        token.id = IdGenerator.newUuid();
        token.userId = userId;
        token.familyId = (familyId != null) ? familyId : IdGenerator.newUuid();
        token.tokenHash = tokenHash;
        token.issuedAt = Instant.now();
        token.expiresAt = expiresAt;
        token.ip = (ip != null && !ip.isBlank()) ? ip.trim() : null;
        token.userAgent = userAgent;
        return token;
    }

    public boolean isActive() {
        return this.revokedAt == null && Instant.now().isBefore(this.expiresAt);
    }

    public void revoke(UUID replacedById) {
        this.revokedAt = Instant.now();
        this.replacedBy = replacedById;
    }

    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public UUID getFamilyId() { return familyId; }
    public String getTokenHash() { return tokenHash; }
    public Instant getIssuedAt() { return issuedAt; }
    public Instant getExpiresAt() { return expiresAt; }
    public Instant getRevokedAt() { return revokedAt; }
    public UUID getReplacedBy() { return replacedBy; }
    public String getIp() { return ip; }
    public String getUserAgent() { return userAgent; }
}
