package com.cajachambala.identidad.domain;

import com.cajachambala.shared.domain.IdGenerator;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcType;
import org.hibernate.dialect.PostgreSQLEnumJdbcType;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "app_user")
public class AppUser {

    @Id
    private UUID id;

    @Column(name = "caja_id", nullable = false)
    private UUID cajaId;

    @Column(nullable = false, unique = true, columnDefinition = "citext")
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @JdbcType(PostgreSQLEnumJdbcType.class)
    @Column(nullable = false)
    private UserRole role;

    @Enumerated(EnumType.STRING)
    @JdbcType(PostgreSQLEnumJdbcType.class)
    @Column(nullable = false)
    private UserStatus status;

    @Column(name = "socio_id", unique = true)
    private UUID socioId;

    @Column(name = "must_change_password", nullable = false)
    private boolean mustChangePassword;

    @Column(name = "mfa_enabled", nullable = false)
    private boolean mfaEnabled;

    @Column(name = "mfa_secret_enc")
    private byte[] mfaSecretEnc;

    @Column(name = "mfa_recovery_hashes", columnDefinition = "text[]")
    private List<String> mfaRecoveryHashes = new ArrayList<>();

    @Column(name = "failed_login_count", nullable = false)
    private short failedLoginCount;

    @Column(name = "locked_until")
    private Instant lockedUntil;

    @Column(name = "last_login_at")
    private Instant lastLoginAt;

    @Column(name = "password_changed_at", nullable = false)
    private Instant passwordChangedAt;

    @Column(name = "token_version", nullable = false)
    private int tokenVersion;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected AppUser() {
        // Para JPA
    }

    public static AppUser create(
            UUID cajaId,
            String email,
            String passwordHash,
            UserRole role,
            UUID socioId,
            boolean mustChangePassword
    ) {
        AppUser user = new AppUser();
        user.id = IdGenerator.newUuid();
        user.cajaId = cajaId;
        user.email = email.toLowerCase().trim();
        user.passwordHash = passwordHash;
        user.role = role;
        user.status = UserStatus.ACTIVO;
        user.socioId = socioId;
        user.mustChangePassword = mustChangePassword;
        user.mfaEnabled = false;
        user.failedLoginCount = 0;
        user.passwordChangedAt = Instant.now();
        user.tokenVersion = 1;
        user.createdAt = Instant.now();
        user.updatedAt = Instant.now();
        return user;
    }

    public boolean isAccountLocked() {
        if (this.status == UserStatus.BLOQUEADO) {
            return true;
        }
        if (this.lockedUntil != null && Instant.now().isBefore(this.lockedUntil)) {
            return true;
        }
        return false;
    }

    public void recordFailedLogin(int maxFailedAttempts, Duration lockDuration) {
        this.failedLoginCount++;
        if (this.failedLoginCount >= maxFailedAttempts) {
            this.lockedUntil = Instant.now().plus(lockDuration);
        }
        this.updatedAt = Instant.now();
    }

    public void bloquearTemporalmente(Duration duration) {
        this.lockedUntil = Instant.now().plus(duration);
        this.updatedAt = Instant.now();
    }

    public void desactivar() {
        this.status = UserStatus.INACTIVO;
        this.updatedAt = Instant.now();
    }

    public void recordSuccessfulLogin() {
        this.failedLoginCount = 0;
        this.lockedUntil = null;
        this.lastLoginAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public void changePassword(String newPasswordHash) {
        this.passwordHash = newPasswordHash;
        this.mustChangePassword = false;
        this.passwordChangedAt = Instant.now();
        this.tokenVersion++; // Invalida JWTs y sesiones previas
        this.updatedAt = Instant.now();
    }

    public void enableMfa(byte[] secretEnc, List<String> recoveryHashes) {
        this.mfaSecretEnc = secretEnc;
        this.mfaRecoveryHashes = new ArrayList<>(recoveryHashes);
        this.mfaEnabled = true;
        this.updatedAt = Instant.now();
    }

    public void disableMfa() {
        this.mfaEnabled = false;
        this.mfaSecretEnc = null;
        this.mfaRecoveryHashes.clear();
        this.tokenVersion++;
        this.updatedAt = Instant.now();
    }

    public boolean useRecoveryCode(String codeHash) {
        if (this.mfaRecoveryHashes != null && this.mfaRecoveryHashes.remove(codeHash)) {
            this.updatedAt = Instant.now();
            return true;
        }
        return false;
    }

    // Getters
    public UUID getId() { return id; }
    public UUID getCajaId() { return cajaId; }
    public String getEmail() { return email; }
    public String getPasswordHash() { return passwordHash; }
    public UserRole getRole() { return role; }
    public UserStatus getStatus() { return status; }
    public UUID getSocioId() { return socioId; }
    public boolean isMustChangePassword() { return mustChangePassword; }
    public boolean isMfaEnabled() { return mfaEnabled; }
    public byte[] getMfaSecretEnc() { return mfaSecretEnc; }
    public List<String> getMfaRecoveryHashes() { return mfaRecoveryHashes; }
    public short getFailedLoginCount() { return failedLoginCount; }
    public Instant getLockedUntil() { return lockedUntil; }
    public Instant getLastLoginAt() { return lastLoginAt; }
    public Instant getPasswordChangedAt() { return passwordChangedAt; }
    public int getTokenVersion() { return tokenVersion; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
