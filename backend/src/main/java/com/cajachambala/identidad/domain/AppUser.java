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

    @Column(name = "display_name", length = 100)
    private String displayName;

    @Column(length = 30)
    private String phone;

    @Column(nullable = false, length = 20)
    private String locale = "es-PE";

    @Column(name = "notifications_enabled", nullable = false)
    private boolean notificationsEnabled = true;

    @Column(name = "pending_email", columnDefinition = "citext")
    private String pendingEmail;

    @Column(name = "email_change_token_hash", length = 64)
    private String emailChangeTokenHash;

    @Column(name = "email_change_expires_at")
    private Instant emailChangeExpiresAt;

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

    public boolean isAuthenticationAllowed() {
        return this.status == UserStatus.ACTIVO && !isAccountLocked();
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

    public void updateProfile(String displayName, String phone, String locale, boolean notificationsEnabled) {
        this.displayName = displayName;
        this.phone = phone;
        this.locale = locale;
        this.notificationsEnabled = notificationsEnabled;
        this.updatedAt = Instant.now();
    }

    public void requestEmailChange(String newEmail, String tokenHash, Instant expiresAt) {
        this.pendingEmail = newEmail.toLowerCase().trim();
        this.emailChangeTokenHash = tokenHash;
        this.emailChangeExpiresAt = expiresAt;
        this.updatedAt = Instant.now();
    }

    public void confirmEmailChange() {
        if (this.pendingEmail == null) throw new IllegalStateException("No hay un cambio de correo pendiente");
        this.email = this.pendingEmail;
        this.pendingEmail = null;
        this.emailChangeTokenHash = null;
        this.emailChangeExpiresAt = null;
        this.tokenVersion++;
        this.updatedAt = Instant.now();
    }

    public void cancelEmailChange() {
        this.pendingEmail = null;
        this.emailChangeTokenHash = null;
        this.emailChangeExpiresAt = null;
        this.updatedAt = Instant.now();
    }

    public void enableMfa(byte[] secretEnc, List<String> recoveryHashes) {
        this.mfaSecretEnc = secretEnc;
        this.mfaRecoveryHashes = new ArrayList<>(recoveryHashes);
        this.mfaEnabled = true;
        this.tokenVersion++;
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
    public String getDisplayName() { return displayName; }
    public String getPhone() { return phone; }
    public String getLocale() { return locale; }
    public boolean isNotificationsEnabled() { return notificationsEnabled; }
    public String getPendingEmail() { return pendingEmail; }
    public String getEmailChangeTokenHash() { return emailChangeTokenHash; }
    public Instant getEmailChangeExpiresAt() { return emailChangeExpiresAt; }
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
