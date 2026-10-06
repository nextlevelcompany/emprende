package com.cajachambala.identidad.application;

import com.cajachambala.identidad.application.dto.AuthDtos.*;
import com.cajachambala.identidad.domain.AppUser;
import com.cajachambala.identidad.infrastructure.audit.AuditService;
import com.cajachambala.identidad.infrastructure.persistence.AppUserRepository;
import com.cajachambala.identidad.infrastructure.security.AesGcmCryptoService;
import com.cajachambala.identidad.infrastructure.security.JwtService;
import com.cajachambala.identidad.infrastructure.security.RefreshTokenService;
import com.cajachambala.identidad.infrastructure.security.TotpService;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class VerifyMfaUseCase {

    private final AppUserRepository appUserRepository;
    private final JwtService jwtService;
    private final AesGcmCryptoService aesGcmCryptoService;
    private final TotpService totpService;
    private final RefreshTokenService refreshTokenService;
    private final AuditService auditService;

    public VerifyMfaUseCase(
            AppUserRepository appUserRepository,
            JwtService jwtService,
            AesGcmCryptoService aesGcmCryptoService,
            TotpService totpService,
            RefreshTokenService refreshTokenService,
            AuditService auditService
    ) {
        this.appUserRepository = appUserRepository;
        this.jwtService = jwtService;
        this.aesGcmCryptoService = aesGcmCryptoService;
        this.totpService = totpService;
        this.refreshTokenService = refreshTokenService;
        this.auditService = auditService;
    }

    @Transactional
    public LoginResponse execute(VerifyMfaRequest request, HttpServletRequest httpRequest) {
        if (request == null || request.mfaToken() == null || request.code() == null) {
            throw new BadCredentialsException("Código de autenticación ausente");
        }

        Claims claims = jwtService.extractClaims(request.mfaToken());
        if (claims == null) {
            throw new BadCredentialsException("Token MFA no válido o expirado");
        }

        UUID userId = UUID.fromString(claims.getSubject());
        AppUser user = appUserRepository.findById(userId)
                .orElseThrow(() -> new BadCredentialsException("Usuario no encontrado"));

        if (!jwtService.isMfaTokenValid(claims, user)) {
            throw new BadCredentialsException("Token MFA inválido o caducado");
        }

        if (!user.isMfaEnabled() || user.getMfaSecretEnc() == null) {
            throw new IllegalStateException("El usuario no tiene MFA habilitado");
        }

        String decryptedSecret = aesGcmCryptoService.decryptString(user.getMfaSecretEnc());
        boolean codeMatches = totpService.verifyCode(decryptedSecret, request.code());

        // Si falla TOTP, verificar si es un código de recuperación
        if (!codeMatches) {
            String hash = totpService.hashRecoveryCode(request.code());
            codeMatches = user.useRecoveryCode(hash);
            if (codeMatches) {
                auditService.logSecurityEvent(user.getCajaId(), user.getId(), user.getRole(), "MFA_RECOVERY_CODE_USED", "Código de recuperación utilizado", httpRequest);
            }
        }

        if (!codeMatches) {
            auditService.logSecurityEvent(user.getCajaId(), user.getId(), user.getRole(), "MFA_VERIFY_FAILED", "Código TOTP inválido", httpRequest);
            throw new BadCredentialsException("Código de verificación incorrecto");
        }

        user.recordSuccessfulLogin();
        appUserRepository.save(user);

        String ip = AuditService.getClientIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        RefreshTokenService.TokenPair tokenPair = refreshTokenService.createRefreshToken(user.getId(), null, ip, userAgent);
        String accessToken = jwtService.generateAccessToken(user);

        auditService.logSecurityEvent(user.getCajaId(), user.getId(), user.getRole(), "LOGIN_SUCCESS_MFA", "Acceso verificado por MFA", httpRequest);

        UserProfileDto profile = LoginUseCase.toProfileDto(user);
        return new LoginResponse(false, null, accessToken, tokenPair.rawRefreshToken(), profile);
    }
}
