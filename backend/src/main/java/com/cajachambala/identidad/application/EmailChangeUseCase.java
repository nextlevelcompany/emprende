package com.cajachambala.identidad.application;

import com.cajachambala.identidad.application.dto.AuthDtos.RequestEmailChangeRequest;
import com.cajachambala.identidad.domain.AppUser;
import com.cajachambala.identidad.domain.UserRole;
import com.cajachambala.identidad.infrastructure.audit.AuditService;
import com.cajachambala.identidad.infrastructure.persistence.AppUserRepository;
import com.cajachambala.identidad.infrastructure.persistence.RefreshTokenRepository;
import com.cajachambala.identidad.infrastructure.security.AccountMailService;
import com.cajachambala.identidad.infrastructure.security.AesGcmCryptoService;
import com.cajachambala.identidad.infrastructure.security.PasswordService;
import com.cajachambala.identidad.infrastructure.security.TotpService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class EmailChangeUseCase {
    private static final SecureRandom RANDOM = new SecureRandom();
    private final AppUserRepository users;
    private final RefreshTokenRepository refreshTokens;
    private final PasswordService passwords;
    private final TotpService totp;
    private final AesGcmCryptoService crypto;
    private final AccountMailService mail;
    private final AuditService audit;

    public EmailChangeUseCase(AppUserRepository users, RefreshTokenRepository refreshTokens, PasswordService passwords,
            TotpService totp, AesGcmCryptoService crypto, AccountMailService mail, AuditService audit) {
        this.users = users;
        this.refreshTokens = refreshTokens;
        this.passwords = passwords;
        this.totp = totp;
        this.crypto = crypto;
        this.mail = mail;
        this.audit = audit;
    }

    @Transactional
    public void request(UUID userId, RequestEmailChangeRequest request, HttpServletRequest httpRequest) {
        AppUser user = users.findById(userId).orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
        requireAdmin(user);
        if (request == null || request.currentPassword() == null || !passwords.matches(request.currentPassword(), user.getPasswordHash())) {
            audit.logSecurityEvent(user.getCajaId(), user.getId(), user.getRole(), "EMAIL_CHANGE_FAILED", "Contraseña actual incorrecta", httpRequest);
            throw new BadCredentialsException("La contraseña actual no es correcta");
        }
        if (user.isMfaEnabled() && (request.mfaCode() == null || user.getMfaSecretEnc() == null
                || !totp.verifyCode(crypto.decryptString(user.getMfaSecretEnc()), request.mfaCode()))) {
            audit.logSecurityEvent(user.getCajaId(), user.getId(), user.getRole(), "EMAIL_CHANGE_FAILED", "Código MFA incorrecto o ausente", httpRequest);
            throw new BadCredentialsException("Confirma el cambio con tu código de autenticación");
        }
        if (request.newEmail() == null || !request.newEmail().matches("(?i)^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+$")) {
            throw new IllegalArgumentException("Ingresa una dirección de correo válida");
        }
        String newEmail = request.newEmail().trim().toLowerCase();
        if (newEmail.equalsIgnoreCase(user.getEmail())) throw new IllegalArgumentException("Ese ya es el correo de acceso actual");
        if (users.findByEmail(newEmail).isPresent()) throw new IllegalArgumentException("Ese correo ya está asociado a otra cuenta");
        if (users.existsByPendingEmail(newEmail)) throw new IllegalArgumentException("Ese correo ya tiene una verificación pendiente");
        if (user.getEmailChangeExpiresAt() != null && user.getEmailChangeExpiresAt().isAfter(Instant.now())) {
            throw new IllegalArgumentException("Ya hay una verificación de correo pendiente. Revisa el correo nuevo antes de solicitar otra.");
        }

        byte[] tokenBytes = new byte[32];
        RANDOM.nextBytes(tokenBytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);
        user.requestEmailChange(newEmail, hash(rawToken), Instant.now().plus(20, ChronoUnit.MINUTES));
        users.save(user);
        // Fallar aquí revierte también el token pendiente: nunca queda un correo nuevo sin envío de verificación.
        mail.sendEmailChangeVerification(newEmail, rawToken);
        audit.logSecurityEvent(user.getCajaId(), user.getId(), user.getRole(), "EMAIL_CHANGE_REQUESTED", "Se envió una verificación de un solo uso al correo nuevo", httpRequest);
    }

    @Transactional
    public void confirm(String rawToken, HttpServletRequest httpRequest) {
        if (rawToken == null || rawToken.length() < 40 || rawToken.length() > 100) throw new IllegalArgumentException("El enlace no es válido o ya venció");
        AppUser user = users.findByEmailChangeTokenHash(hash(rawToken)).orElseThrow(() -> new IllegalArgumentException("El enlace no es válido o ya venció"));
        requireAdmin(user);
        if (user.getEmailChangeExpiresAt() == null || user.getEmailChangeExpiresAt().isBefore(Instant.now())) {
            user.cancelEmailChange();
            users.save(user);
            throw new IllegalArgumentException("El enlace de verificación venció. Solicita un nuevo cambio de correo.");
        }
        if (users.findByEmail(user.getPendingEmail()).filter(other -> !other.getId().equals(user.getId())).isPresent()) {
            user.cancelEmailChange();
            users.save(user);
            throw new IllegalArgumentException("El correo ya fue asociado a otra cuenta");
        }
        String previousEmail = user.getEmail();
        Map<String, Object> before = Map.of("email", previousEmail);
        user.confirmEmailChange();
        users.save(user);
        refreshTokens.revokeAllByUserId(user.getId());
        Map<String, Object> after = new LinkedHashMap<>();
        after.put("email", user.getEmail());
        audit.registrar(user.getCajaId(), user.getId(), user.getRole(), "ADMIN_EMAIL_CHANGED", "APP_USER", user.getId(), before, after, null, null);
        try {
            mail.notifyEmailChanged(previousEmail);
        } catch (RuntimeException ignored) {
            // El cambio ya está verificado; un fallo de notificación no debe revertirlo.
        }
    }

    private void requireAdmin(AppUser user) {
        if (user.getRole() != UserRole.ADMIN) throw new AccessDeniedException("Solo administración puede cambiar este correo");
    }

    private String hash(String rawToken) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (Exception exception) {
            throw new IllegalStateException("No se pudo procesar el token de verificación", exception);
        }
    }
}
