package com.cajachambala.identidad.application;

import com.cajachambala.identidad.application.dto.AuthDtos.DisableMfaRequest;
import com.cajachambala.identidad.domain.AppUser;
import com.cajachambala.identidad.domain.UserRole;
import com.cajachambala.identidad.infrastructure.audit.AuditService;
import com.cajachambala.identidad.infrastructure.persistence.AppUserRepository;
import com.cajachambala.identidad.infrastructure.persistence.RefreshTokenRepository;
import com.cajachambala.identidad.infrastructure.security.AesGcmCryptoService;
import com.cajachambala.identidad.infrastructure.security.PasswordService;
import com.cajachambala.identidad.infrastructure.security.TotpService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class DisableMfaUseCase {
    private final AppUserRepository users;
    private final PasswordService passwords;
    private final TotpService totp;
    private final AesGcmCryptoService crypto;
    private final RefreshTokenRepository refreshTokens;
    private final AuditService audit;

    public DisableMfaUseCase(AppUserRepository users, PasswordService passwords, TotpService totp,
            AesGcmCryptoService crypto, RefreshTokenRepository refreshTokens, AuditService audit) {
        this.users = users;
        this.passwords = passwords;
        this.totp = totp;
        this.crypto = crypto;
        this.refreshTokens = refreshTokens;
        this.audit = audit;
    }

    @Transactional
    public void execute(UUID userId, DisableMfaRequest request, HttpServletRequest httpRequest) {
        AppUser user = users.findById(userId).orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
        if (user.getRole() != UserRole.ADMIN) throw new AccessDeniedException("Solo administración puede modificar MFA");
        if (request == null || request.currentPassword() == null || !passwords.matches(request.currentPassword(), user.getPasswordHash())) {
            audit.logSecurityEvent(user.getCajaId(), user.getId(), user.getRole(), "MFA_DISABLE_FAILED", "Contraseña actual incorrecta", httpRequest);
            throw new BadCredentialsException("La contraseña actual no es correcta");
        }
        if (!user.isMfaEnabled() || user.getMfaSecretEnc() == null) throw new IllegalArgumentException("La verificación en dos pasos ya está desactivada");
        if (request.code() == null || !totp.verifyCode(crypto.decryptString(user.getMfaSecretEnc()), request.code())) {
            audit.logSecurityEvent(user.getCajaId(), user.getId(), user.getRole(), "MFA_DISABLE_FAILED", "Código de verificación incorrecto", httpRequest);
            throw new BadCredentialsException("El código de autenticación no es correcto");
        }
        user.disableMfa();
        users.save(user);
        refreshTokens.revokeAllByUserId(user.getId());
        audit.logSecurityEvent(user.getCajaId(), user.getId(), user.getRole(), "MFA_DISABLED", "MFA desactivado con reautenticación; todas las sesiones fueron revocadas", httpRequest);
    }
}
