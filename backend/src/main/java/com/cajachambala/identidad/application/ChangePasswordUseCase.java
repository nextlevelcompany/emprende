package com.cajachambala.identidad.application;

import com.cajachambala.identidad.application.dto.AuthDtos.*;
import com.cajachambala.identidad.domain.AppUser;
import com.cajachambala.identidad.infrastructure.audit.AuditService;
import com.cajachambala.identidad.infrastructure.persistence.AppUserRepository;
import com.cajachambala.identidad.infrastructure.persistence.RefreshTokenRepository;
import com.cajachambala.identidad.infrastructure.security.JwtService;
import com.cajachambala.identidad.infrastructure.security.PasswordService;
import com.cajachambala.identidad.infrastructure.security.RefreshTokenService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class ChangePasswordUseCase {

    private final AppUserRepository appUserRepository;
    private final PasswordService passwordService;
    private final RefreshTokenRepository refreshTokenRepository;
    private final RefreshTokenService refreshTokenService;
    private final JwtService jwtService;
    private final AuditService auditService;

    public ChangePasswordUseCase(
            AppUserRepository appUserRepository,
            PasswordService passwordService,
            RefreshTokenRepository refreshTokenRepository,
            RefreshTokenService refreshTokenService,
            JwtService jwtService,
            AuditService auditService
    ) {
        this.appUserRepository = appUserRepository;
        this.passwordService = passwordService;
        this.refreshTokenRepository = refreshTokenRepository;
        this.refreshTokenService = refreshTokenService;
        this.jwtService = jwtService;
        this.auditService = auditService;
    }

    @Transactional
    public TokenResponse execute(UUID userId, ChangePasswordRequest request, HttpServletRequest httpRequest) {
        if (request == null || request.newPassword() == null) {
            throw new IllegalArgumentException("La nueva contraseña es obligatoria");
        }

        AppUser user = appUserRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        // Si no es un cambio forzoso de primera vez, verificar la contraseña actual
        if (!user.isMustChangePassword()) {
            if (request.currentPassword() == null || !passwordService.matches(request.currentPassword(), user.getPasswordHash())) {
                auditService.logSecurityEvent(user.getCajaId(), user.getId(), user.getRole(), "PASSWORD_CHANGE_FAILED", "Contraseña actual incorrecta", httpRequest);
                throw new BadCredentialsException("La contraseña actual proporcionada no es correcta");
            }
        }

        if (passwordService.matches(request.newPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("La nueva contraseña no puede ser idéntica a la anterior");
        }

        passwordService.validatePasswordStrength(request.newPassword(), user.getEmail());

        String newHash = passwordService.encode(request.newPassword());
        user.changePassword(newHash);
        appUserRepository.save(user);

        // Revocar todas las sesiones anteriores
        refreshTokenRepository.revokeAllByUserId(user.getId());

        String ip = AuditService.getClientIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        RefreshTokenService.TokenPair tokenPair = refreshTokenService.createRefreshToken(user.getId(), null, ip, userAgent);
        String newAccessToken = jwtService.generateAccessToken(user);

        auditService.logSecurityEvent(user.getCajaId(), user.getId(), user.getRole(), "PASSWORD_CHANGED", "Contraseña actualizada e invalidación de sesiones previas", httpRequest);

        return new TokenResponse(newAccessToken, tokenPair.rawRefreshToken());
    }
}
