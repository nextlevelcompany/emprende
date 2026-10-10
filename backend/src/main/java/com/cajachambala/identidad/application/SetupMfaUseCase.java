package com.cajachambala.identidad.application;

import com.cajachambala.identidad.application.dto.AuthDtos.*;
import com.cajachambala.identidad.domain.AppUser;
import com.cajachambala.identidad.infrastructure.audit.AuditService;
import com.cajachambala.identidad.infrastructure.persistence.AppUserRepository;
import com.cajachambala.identidad.infrastructure.security.AesGcmCryptoService;
import com.cajachambala.identidad.infrastructure.security.TotpService;
import com.cajachambala.identidad.infrastructure.security.PasswordService;
import com.cajachambala.identidad.domain.UserRole;
import com.cajachambala.identidad.infrastructure.persistence.RefreshTokenRepository;
import com.cajachambala.identidad.infrastructure.security.JwtService;
import com.cajachambala.identidad.infrastructure.security.RefreshTokenService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class SetupMfaUseCase {

    private final AppUserRepository appUserRepository;
    private final TotpService totpService;
    private final AesGcmCryptoService aesGcmCryptoService;
    private final AuditService auditService;
    private final PasswordService passwordService;
    private final RefreshTokenRepository refreshTokenRepository;
    private final RefreshTokenService refreshTokenService;
    private final JwtService jwtService;

    public SetupMfaUseCase(
            AppUserRepository appUserRepository,
            TotpService totpService,
            AesGcmCryptoService aesGcmCryptoService,
            AuditService auditService,
            PasswordService passwordService,
            RefreshTokenRepository refreshTokenRepository,
            RefreshTokenService refreshTokenService,
            JwtService jwtService
    ) {
        this.appUserRepository = appUserRepository;
        this.totpService = totpService;
        this.aesGcmCryptoService = aesGcmCryptoService;
        this.auditService = auditService;
        this.passwordService = passwordService;
        this.refreshTokenRepository = refreshTokenRepository;
        this.refreshTokenService = refreshTokenService;
        this.jwtService = jwtService;
    }

    @Transactional(readOnly = true)
    public MfaSetupResponse initiate(UUID userId, SetupMfaRequest request, jakarta.servlet.http.HttpServletRequest httpRequest) {
        AppUser user = appUserRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
        requireAdmin(user);
        verifyPassword(user, request != null ? request.currentPassword() : null, httpRequest);
        if (user.isMfaEnabled()) throw new IllegalArgumentException("MFA ya está activo. Para modificarlo, desactívalo primero con contraseña y código vigente.");

        String base32Secret = totpService.generateSecret();
        String otpAuthUri = totpService.generateOtpAuthUri("Caja Chambala", user.getEmail(), base32Secret);

        return new MfaSetupResponse(base32Secret, otpAuthUri);
    }

    @Transactional
    public MfaConfirmedResponse confirm(UUID userId, SetupMfaConfirmRequest request, HttpServletRequest httpRequest) {
        if (request == null || request.secret() == null || request.code() == null) {
            throw new IllegalArgumentException("Datos de confirmación incompletos");
        }

        AppUser user = appUserRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
        requireAdmin(user);
        verifyPassword(user, request.currentPassword(), httpRequest);
        if (user.isMfaEnabled()) throw new IllegalArgumentException("MFA ya está activo. Para modificarlo, desactívalo primero con contraseña y código vigente.");

        boolean isValid = totpService.verifyCode(request.secret(), request.code());
        if (!isValid) {
            throw new IllegalArgumentException("Código de verificación incorrecto. Asegúrate de haber sincronizado la hora de tu aplicación.");
        }

        byte[] secretEnc = aesGcmCryptoService.encryptString(request.secret());
        List<String> rawRecoveryCodes = totpService.generateRecoveryCodes(8);
        List<String> hashedCodes = rawRecoveryCodes.stream()
                .map(totpService::hashRecoveryCode)
                .toList();

        user.enableMfa(secretEnc, hashedCodes);
        appUserRepository.save(user);
        refreshTokenRepository.revokeAllByUserId(user.getId());
        String ip = AuditService.getClientIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        RefreshTokenService.TokenPair tokenPair = refreshTokenService.createRefreshToken(user.getId(), null, ip, userAgent);
        String accessToken = jwtService.generateAccessToken(user);

        auditService.logSecurityEvent(user.getCajaId(), user.getId(), user.getRole(), "MFA_ENABLED", "Segundo factor de autenticación configurado exitosamente", httpRequest);

        return new MfaConfirmedResponse(true, rawRecoveryCodes, accessToken, tokenPair.rawRefreshToken());
    }

    private void verifyPassword(AppUser user, String currentPassword, HttpServletRequest request) {
        if (currentPassword == null || !passwordService.matches(currentPassword, user.getPasswordHash())) {
            auditService.logSecurityEvent(user.getCajaId(), user.getId(), user.getRole(), "MFA_SETUP_FAILED", "Contraseña actual incorrecta", request);
            throw new org.springframework.security.authentication.BadCredentialsException("La contraseña actual no es correcta");
        }
    }

    private void requireAdmin(AppUser user) {
        if (user.getRole() != UserRole.ADMIN) throw new org.springframework.security.access.AccessDeniedException("Solo administración puede configurar MFA desde el perfil");
    }
}
